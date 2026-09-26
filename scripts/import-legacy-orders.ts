/**
 * Imports a legacy WooCommerce order export (CSV) into the Registrations collection.
 *
 *   env $(grep -v '^#' .env.staging | xargs) npx tsx scripts/import-legacy-orders.ts [path/to/export.csv] [--dry-run]
 *
 * Defaults to data/Order Items Export - 2026-09-26 (1).csv. --dry-run prints the mapped payloads
 * (with resolved relationship IDs) without writing. Orders whose
 * legacyWooOrderId already exists are skipped, so re-runs are safe.
 *
 * Column mapping (headers are trimmed + case-insensitive; a repeated header
 * gets a " (2)" suffix, e.g. the export has two "Gender #2", "Class Date #2",
 * "Teacher Name #2" and "Order Total"):
 *
 *   Order ID                         → legacyWooOrderId
 *   Moneris Transaction ID           → monerisOrderId
 *   P/G F/N, P/G LN, P/G Email, Phone→ parent fields (+ parent link if an account exists);
 *                                      an invalid email gets a placeholder and is kept in notes
 *   E/C Name, E/C Phone              → emergency contact (registration + student #1)
 *   S FN #1, S LN #1, Age #1         → students[0]
 *   Gender #2  (1st occurrence)      → students[0].gender  (mislabelled in the export)
 *   Student First/Last Name #2, Student Age #2,
 *   Emergency Contact Name/Phone #2  → students[1]
 *   Teacher Name #1, Division #1     → students[0].teacherName / divisionNumber
 *   Class Date #2 (1st) or #1        → students[0].classDate
 *   Teacher Name #2, Division #2     → students[1].teacherName / divisionNumber
 *   Class Date #2 (2nd occurrence)   → students[1].classDate, else student #1's date
 *   Order Tax, Order Total           → gstAmount, unitPrice = (total − tax) / students
 *   Order Status                     → orderStatus + paymentStatus
 *   Order Date                       → createdAt
 *   Product Name "Title (City)"      → product (+ city used to disambiguate schools)
 *   Season / Variation Attributes    → season + school, matched by slugified title
 *   Location, Schedule/Time, Weeks Selected → campVariationId (camp products)
 *   student #1's class date          → classDate (order level, used in confirmations)
 *   Order Note - Most Recent, Notes? → notes[]
 */
import fs from 'fs'
import path from 'path'

type Row = Record<string, string>
type Id = string | number

type OrderStatus = 'pending' | 'processing' | 'completed' | 'on_hold' | 'cancelled' | 'refunded' | 'failed'
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'waived'
type NoteType = 'system' | 'payment' | 'admin'
type Gender = 'Male' | 'Female' | 'Rather Not Say'

type Student = {
  firstName: string
  lastName?: string
  age?: string
  gender?: Gender
  emergencyContactName?: string
  emergencyContactPhone?: string
  teacherName?: string
  divisionNumber?: string
  classDate?: string
}

type Note = { note: string; timestamp?: string; type: NoteType }

type Mapped = {
  data: {
    parentFirstName: string
    parentLastName: string
    parentEmail: string
    parentPhone: string
    emergencyContactFirstName?: string
    emergencyContactLastName?: string
    emergencyContactPhone?: string
    students: Student[]
    legacyWooOrderId: string
    monerisOrderId?: string
    orderStatus: OrderStatus
    paymentStatus: PaymentStatus
    unitPrice?: number
    gstAmount?: number
    classDate?: string
    createdAt?: string
    notes: Note[]
  }
  lookup: {
    productTitle: string
    city?: string
    seasonSlug?: string
    attributeSlugs: string[]
    location?: string
    timeslot?: string
    week?: string
  }
  legacyTotal?: number
  warnings: string[]
}

// ── CSV parsing ──────────────────────────────────────────────────────────────

/** RFC 4180 parser: quoted fields, escaped quotes, embedded newlines, CRLF, BOM. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const s = text.replace(/^﻿/, '')

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

const normKey = (h: string) => h.trim().toLowerCase().replace(/\s+/g, ' ')

function toObjects(rows: string[][]): Row[] {
  const [header, ...body] = rows
  const seen = new Map<string, number>()
  const keys = header.map((h) => {
    const k = normKey(h)
    const n = (seen.get(k) ?? 0) + 1
    seen.set(k, n)
    return n === 1 ? k : `${k} (${n})`
  })
  return body.map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? '').trim()])))
}

// ── Mapping ──────────────────────────────────────────────────────────────────

const get = (row: Row, ...cols: string[]) => {
  for (const col of cols) {
    const v = row[normKey(col)]
    if (v) return v
  }
  return ''
}

const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const looksLikePhone = (s: string) => /^[+\d\s().-]{7,}$/.test(s)
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

function splitName(full: string): { first?: string; last?: string } {
  const parts = full.trim().split(/\s+/)
  if (!parts[0]) return {}
  return { first: parts[0], last: parts.slice(1).join(' ') || undefined }
}

/** WooCommerce status label → orderStatus. Keys are normalised by normStatus(). */
const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  'processing': 'processing',
  'completed': 'completed',
  'pending payment': 'pending',
  'pending': 'pending',
  'draft': 'pending',
  'checkout draft': 'pending',
  'on hold': 'on_hold',
  'cancelled': 'cancelled',
  'refunded': 'refunded',
  'failed': 'failed',
}

// "  On-Hold ", "wc-on-hold", "ON_HOLD" → "on hold"
const normStatus = (raw: string) =>
  raw.trim().toLowerCase().replace(/^wc-/, '').replace(/[-_\s]+/g, ' ').trim()

function mapOrderStatus(raw: string): OrderStatus | undefined {
  return ORDER_STATUS_MAP[normStatus(raw)]
}

function paymentStatusFor(status: OrderStatus): PaymentStatus {
  if (status === 'completed' || status === 'processing') return 'paid'
  if (status === 'refunded') return 'refunded'
  return 'pending'
}

function mapGender(raw: string): Gender | undefined {
  const v = raw.toLowerCase()
  if (v === 'm' || v === 'male' || v === 'boy') return 'Male'
  if (v === 'f' || v === 'female' || v === 'girl') return 'Female'
  if (v === 'rather not say') return 'Rather Not Say'
  return undefined // blank / "Choose an Option"
}

function toCents(raw: string): number | undefined {
  if (!raw) return undefined
  const n = parseFloat(raw.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : undefined
}

function toIso(raw: string): string | undefined {
  if (!raw) return undefined
  // Date-only values are local calendar dates; parse at local midnight, not UTC
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/**
 * Teacher / division / class date for student n. The export's first "Class Date #2"
 * column holds student #1's date; the second one (" (2)") holds student #2's.
 */
function perStudent(row: Row, n: 1 | 2, fallbackClassDate = ''): Pick<Student, 'teacherName' | 'divisionNumber' | 'classDate'> {
  const teacherName = n === 1
    ? get(row, 'Teacher Name #1', 'Teacher Name')
    : get(row, 'Teacher Name #2', 'Teacher Name #2 (2)', 'Teacher Name')
  const divisionNumber = get(row, `Division #${n}`, 'Division #')
  const classDate = (n === 1
    ? get(row, 'Class Date #2', 'Class Date #1', 'Class Date')
    : get(row, 'Class Date #2 (2)')) || fallbackClassDate
  return {
    ...(teacherName ? { teacherName } : {}),
    ...(divisionNumber ? { divisionNumber } : {}),
    ...(classDate ? { classDate } : {}),
  }
}

function mapRow(row: Row): Mapped {
  const warnings: string[] = []
  const orderId = get(row, 'Order ID')
  const orderDate = toIso(get(row, 'Order Date'))

  // Some rows have a name in the email column; keep the original in notes and use a
  // placeholder on the reserved .invalid TLD so nothing is ever sent to it
  const emailRaw = get(row, 'P/G Email')
  const parentEmail = isEmail(emailRaw) ? emailRaw.toLowerCase() : `legacy-order-${orderId}@no-email.invalid`

  // Emergency contact — the legacy form sometimes got a phone number in the name field
  const ecNameRaw = get(row, 'E/C Name')
  const ecPhone = get(row, 'E/C Phone')
  const ecName = looksLikePhone(ecNameRaw) ? '' : ecNameRaw
  const ec = splitName(ecName)

  const students: Student[] = []
  const s1First = get(row, 'S FN #1', 'SFN #1')
  if (s1First) {
    students.push({
      firstName: s1First,
      lastName: get(row, 'S LN #1', 'SLN #1') || undefined,
      age: get(row, 'Age #1') || undefined,
      // First "Gender #2" column is actually student #1's gender
      gender: mapGender(get(row, 'Gender #1', 'Gender #2')),
      emergencyContactName: ecName || undefined,
      emergencyContactPhone: ecPhone || undefined,
      ...perStudent(row, 1),
    })
  }
  const s2First = get(row, 'Student First Name #2', 'S FN #2', 'SFN #2')
  if (s2First) {
    // The second "Gender #2" column mirrors student #1 on every row, so it isn't trusted for student #2
    students.push({
      firstName: s2First,
      lastName: get(row, 'Student Last Name #2', 'S LN #2', 'SLN #2') || undefined,
      age: get(row, 'Student Age #2', 'Age #2') || undefined,
      emergencyContactName: get(row, 'Emergency Contact Name #2') || undefined,
      emergencyContactPhone: get(row, 'Emergency Contact Phone #2') || undefined,
      ...perStudent(row, 2, students[0]?.classDate),
    })
  }

  // Unknown statuses fall back to pending so they stay off the roster until reviewed
  const statusRaw = get(row, 'Order Status')
  const mappedStatus = mapOrderStatus(statusRaw)
  if (!mappedStatus) warnings.push(`unrecognised Order Status "${statusRaw}" → pending`)
  const orderStatus = mappedStatus ?? 'pending'

  const notes: Note[] = [
    { note: `Imported from legacy WooCommerce export (order #${orderId}).`, timestamp: new Date().toISOString(), type: 'system' },
  ]
  const lastNote = get(row, 'Order Note - Most Recent')
  const adminNote = get(row, 'Notes?')
  if (lastNote) notes.push({ note: lastNote, timestamp: orderDate, type: 'system' })
  if (adminNote) notes.push({ note: adminNote, timestamp: orderDate, type: 'admin' })
  if (!isEmail(emailRaw)) {
    notes.push({ note: `Legacy P/G Email field contained "${emailRaw}" (not a valid email); placeholder address assigned.`, timestamp: orderDate, type: 'admin' })
    warnings.push(`invalid P/G Email "${emailRaw}" → ${parentEmail}`)
  }
  if (ecNameRaw && !ecName) {
    notes.push({ note: `Legacy emergency contact name field contained "${ecNameRaw}".`, timestamp: orderDate, type: 'system' })
  }

  // The export has two "Order Total" columns; the first is usually blank
  const total = toCents(get(row, 'Order Total', 'Order Total (2)'))
  const tax = toCents(get(row, 'Order Tax', 'Line Taxes', 'Tax')) ?? 0
  let unitPrice: number | undefined
  if (total !== undefined && students.length > 0) {
    unitPrice = Math.round((total - tax) / students.length)
    if (unitPrice * students.length + tax !== total) warnings.push(`total ${total} doesn't split evenly across ${students.length} students`)
    notes.push({ note: `Legacy order total: $${(total / 100).toFixed(2)} (tax $${(tax / 100).toFixed(2)})`, timestamp: orderDate, type: 'payment' })
  }

  const productName = get(row, 'Product Name', 'Product')
  const cityMatch = productName.match(/\(([^)]+)\)\s*$/)
  const attributeSlugs = get(row, 'Variation Attributes').split(',').map((s) => slugify(s)).filter(Boolean)

  return {
    data: {
      parentFirstName: get(row, 'P/G F/N'),
      parentLastName: get(row, 'P/G LN', 'P/G L/N'),
      parentEmail,
      parentPhone: get(row, 'Phone'),
      ...(ec.first ? { emergencyContactFirstName: ec.first } : {}),
      ...(ec.last ? { emergencyContactLastName: ec.last } : {}),
      ...(ecPhone ? { emergencyContactPhone: ecPhone } : {}),
      students,
      legacyWooOrderId: orderId,
      ...(get(row, 'Moneris Transaction ID') ? { monerisOrderId: get(row, 'Moneris Transaction ID') } : {}),
      orderStatus,
      paymentStatus: paymentStatusFor(orderStatus),
      ...(unitPrice !== undefined ? { unitPrice, gstAmount: tax } : {}),
      ...(students[0]?.classDate || get(row, 'Schedule/Time') ? { classDate: students[0]?.classDate || get(row, 'Schedule/Time') } : {}),
      ...(orderDate ? { createdAt: orderDate } : {}),
      notes,
    },
    lookup: {
      productTitle: cityMatch ? productName.slice(0, cityMatch.index).trim() : productName,
      city: cityMatch?.[1],
      seasonSlug: slugify(get(row, 'Season')) || undefined,
      attributeSlugs,
      location: get(row, 'Location') || undefined,
      timeslot: get(row, 'Schedule/Time') || undefined,
      week: get(row, 'Weeks Selected') || undefined,
    },
    legacyTotal: total,
    warnings,
  }
}

function validate({ data, lookup }: Mapped): string[] {
  const problems: string[] = []
  if (!data.legacyWooOrderId) problems.push('missing Order ID')
  if (!data.parentFirstName) problems.push('missing P/G F/N')
  if (!data.parentLastName) problems.push('missing P/G LN')
  if (!isEmail(data.parentEmail)) problems.push(`invalid P/G Email "${data.parentEmail}"`)
  if (!data.parentPhone) problems.push('missing Phone')
  if (data.students.length === 0) problems.push('no students')
  if (!lookup.productTitle) problems.push('missing Product Name')
  return problems
}

// ── Relationship resolution ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>

async function loadPayload() {
  // Same @next/env interop patch the seed scripts use via `node --require`
  await import('../src/seed-preload.cjs')
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  return getPayload({ config })
}

type Payload = Awaited<ReturnType<typeof loadPayload>>

async function buildResolver(payload: Payload) {
  const all = async (collection: 'schools' | 'seasons' | 'products' | 'cities' | 'locations' | 'timeslots' | 'camp-weeks') =>
    (await payload.find({ collection, limit: 5000, depth: 0, pagination: false })).docs as AnyDoc[]

  const [schools, seasons, products, cities, locations, timeslots, weeks] = await Promise.all([
    all('schools'), all('seasons'), all('products'), all('cities'), all('locations'), all('timeslots'), all('camp-weeks'),
  ])
  const relId = (v: unknown): Id | undefined => (v && typeof v === 'object' ? (v as AnyDoc).id : (v as Id | undefined))

  return (m: Mapped) => {
    const errors: string[] = []
    const { lookup } = m

    const productTitle = lookup.productTitle.toLowerCase()
    const product = products.find((p) => String(p.title).toLowerCase() === productTitle)
    if (!product) errors.push(`product "${lookup.productTitle}" not found`)

    const seasonSlugs = [lookup.seasonSlug, ...lookup.attributeSlugs].filter(Boolean)
    const season = seasons.find((s) => seasonSlugs.includes(slugify(s.title)))

    // School slug comes from Variation Attributes; narrow by the city in the product name
    const city = lookup.city
      ? cities.find((c) => slugify(c.title).startsWith(slugify(lookup.city!)))
      : undefined
    const schoolCandidates = schools.filter((s) => lookup.attributeSlugs.includes(slugify(s.title)))
    const school = schoolCandidates.length > 1 && city
      ? schoolCandidates.find((s) => relId(s.city) === city.id)
      : schoolCandidates[0]

    // Camp attribution: match the product variation by location / timeslot / week labels
    let campVariationId: string | undefined
    if (product && (lookup.location || lookup.week)) {
      const byLabel = (docs: AnyDoc[], field: string, label?: string) =>
        label ? docs.find((d) => slugify(String(d[field])) === slugify(label))?.id : undefined
      const locationId = byLabel(locations, 'name', lookup.location)
      const timeslotId = byLabel(timeslots, 'label', lookup.timeslot)
      const weekId = byLabel(weeks, 'label', lookup.week)
      const variation = ((product.variations ?? []) as AnyDoc[]).find((v) =>
        (!locationId || relId(v.location) === locationId) &&
        (!timeslotId || relId(v.timeslot) === timeslotId) &&
        (!weekId || relId(v.campWeek) === weekId),
      )
      if (variation) campVariationId = variation.id
      else errors.push(`no camp variation for location "${lookup.location}" / time "${lookup.timeslot}" / week "${lookup.week}"`)
    }

    const warnings: string[] = []
    if (!season) warnings.push(`season not found (${seasonSlugs.join(', ')})`)
    if (!school && !campVariationId) warnings.push(`school not found (${lookup.attributeSlugs.join(', ')})`)

    return {
      errors,
      warnings,
      relations: {
        product: product?.id as Id | undefined,
        season: season?.id as Id | undefined,
        school: school?.id as Id | undefined,
        ...(campVariationId ? { campVariationId } : {}),
      },
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const csvPath = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'data/Order Items Export - 2026-09-26 (1).csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const rows = toObjects(parseCsv(fs.readFileSync(csvPath, 'utf-8')))
  if (rows.length > 0 && !('order id' in rows[0])) {
    console.error('CSV has no "Order ID" column — is this a legacy order export?')
    process.exit(1)
  }

  const payload = await loadPayload()
  const resolve = await buildResolver(payload)

  let created = 0
  let skipped = 0
  let failed = 0
  const preview: AnyDoc[] = []

  for (const [i, row] of rows.entries()) {
    const m = mapRow(row)
    const label = `line ${i + 2} #${m.data.legacyWooOrderId || '?'}`

    const problems = validate(m)
    const { errors, warnings, relations } = resolve(m)
    for (const w of [...m.warnings, ...warnings]) console.warn(`  ⚠ ${label}: ${w}`)
    if (problems.length || errors.length) {
      console.error(`✗ ${label}: ${[...problems, ...errors].join('; ')}`)
      failed++
      continue
    }

    const existing = await payload.find({
      collection: 'registrations',
      where: { legacyWooOrderId: { equals: m.data.legacyWooOrderId } },
      limit: 1,
      depth: 0,
    })
    if (existing.totalDocs > 0) {
      console.log(`↷ ${label}: already imported as registration ${existing.docs[0].id}`)
      skipped++
      continue
    }

    const parent = await payload.find({
      collection: 'parents',
      where: { email: { equals: m.data.parentEmail } },
      limit: 1,
      depth: 0,
    })

    const data = { ...m.data, ...relations, ...(parent.docs[0] ? { parent: parent.docs[0].id } : {}) }
    if (dryRun) {
      preview.push(data)
      continue
    }

    try {
      const doc = await payload.create({
        collection: 'registrations',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      })
      if (m.legacyTotal !== undefined && doc.totalAmount !== m.legacyTotal) {
        console.warn(`  ⚠ ${label}: stored total ${doc.totalAmount} ≠ legacy total ${m.legacyTotal}`)
      }
      console.log(`✓ ${label} → registration ${doc.id} (${m.data.students.map((s) => s.firstName).join(', ')})`)
      created++
    } catch (err) {
      console.error(`✗ ${label}: ${(err as Error).message}`)
      failed++
    }
  }

  if (dryRun) console.log(JSON.stringify(preview, null, 2))
  console.log(`\n${dryRun ? 'Dry run — would create' : 'Created'} ${dryRun ? preview.length : created}, skipped ${skipped}, failed ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
