/**
 * Imports legacy WooCommerce order exports (CSV) into the Registrations collection.
 *
 * Dry run (default) — parses the CSV and prints the mapped registration payloads
 * as JSON. Does not touch the database.
 *
 *   npx tsx scripts/import-legacy-orders.ts [path/to/export.csv]
 *
 * Write mode — resolves School / Season / Product by title and creates
 * registrations. Orders whose legacyWooOrderId already exists are skipped.
 *
 *   node --require ./src/seed-preload.cjs --require tsx/cjs \
 *     scripts/import-legacy-orders.ts [path/to/export.csv] --write [--product <id>]
 *
 * Recognised columns (header match is case-insensitive; all but Order ID optional):
 *   Order ID, Order Date, Order Status, Order Total, Tax,
 *   P/G F/N, P/G L/N, P/G Email, Phone,
 *   SFN #n, SLN #n, Age #n, Grade #n, Gender #n, Medical #n   (n = 1, 2, …)
 *   School, Season, Product, Order Notes, Customer Note
 */
import fs from 'fs'
import path from 'path'

type Row = Record<string, string>

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'waived'
type NoteType = 'system' | 'payment' | 'admin'

type MappedRegistration = {
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  students: {
    firstName: string
    lastName?: string
    age?: string
    grade?: string
    gender?: 'Male' | 'Female' | 'Rather Not Say'
    medicalNotes?: string
  }[]
  legacyWooOrderId: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  unitPrice?: number
  gstAmount?: number
  notes: { note: string; timestamp?: string; type: NoteType }[]
  // Resolved to relationship IDs in write mode
  _lookup: { school?: string; season?: string; product?: string }
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

function toObjects(rows: string[][]): Row[] {
  const [header, ...body] = rows
  const keys = header.map((h) => h.trim().toLowerCase())
  return body.map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? '').trim()])))
}

// ── Mapping ──────────────────────────────────────────────────────────────────

const get = (row: Row, col: string) => row[col.toLowerCase()] ?? ''

function mapOrderStatus(raw: string): OrderStatus {
  const v = raw.toLowerCase().replace(/^wc-/, '').trim()
  if (v === 'pending' || v === 'on-hold' || v === 'pending payment') return 'pending'
  if (v === 'processing') return 'processing'
  if (v === 'cancelled' || v === 'failed') return 'cancelled'
  if (v === 'refunded') return 'refunded'
  return 'completed'
}

function paymentStatusFor(status: OrderStatus): PaymentStatus {
  if (status === 'completed' || status === 'processing') return 'paid'
  if (status === 'refunded') return 'refunded'
  return 'pending'
}

function mapGender(raw: string): MappedRegistration['students'][number]['gender'] {
  const v = raw.toLowerCase()
  if (v === 'm' || v === 'male' || v === 'boy') return 'Male'
  if (v === 'f' || v === 'female' || v === 'girl') return 'Female'
  if (v) return 'Rather Not Say'
  return undefined
}

function toCents(raw: string): number | undefined {
  const n = parseFloat(raw.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : undefined
}

function toIso(raw: string): string | undefined {
  if (!raw) return undefined
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function mapRow(row: Row): MappedRegistration {
  const orderId = get(row, 'Order ID')

  // Student slots: SFN #1, SFN #2, … with matching SLN / Age / Grade / Gender / Medical columns
  const slots = Object.keys(row)
    .map((k) => k.match(/^sfn #(\d+)$/)?.[1])
    .filter((n): n is string => !!n)
    .sort((a, b) => Number(a) - Number(b))

  const students = slots
    .filter((n) => get(row, `SFN #${n}`))
    .map((n) => {
      const student: MappedRegistration['students'][number] = { firstName: get(row, `SFN #${n}`) }
      const lastName = get(row, `SLN #${n}`)
      const age = get(row, `Age #${n}`)
      const grade = get(row, `Grade #${n}`)
      const gender = mapGender(get(row, `Gender #${n}`))
      const medical = get(row, `Medical #${n}`)
      if (lastName) student.lastName = lastName
      if (age) student.age = age
      if (grade) student.grade = grade
      if (gender) student.gender = gender
      if (medical) student.medicalNotes = medical
      return student
    })

  const orderStatus = mapOrderStatus(get(row, 'Order Status'))
  const orderDate = toIso(get(row, 'Order Date'))

  const notes: MappedRegistration['notes'] = [
    { note: `Imported from legacy WooCommerce export (order #${orderId}).`, timestamp: new Date().toISOString(), type: 'system' },
  ]
  const orderNotes = get(row, 'Order Notes')
  const customerNote = get(row, 'Customer Note')
  if (orderNotes) notes.push({ note: orderNotes, timestamp: orderDate, type: 'admin' })
  if (customerNote) notes.push({ note: `Customer note: ${customerNote}`, timestamp: orderDate, type: 'admin' })

  const total = toCents(get(row, 'Order Total'))
  const tax = toCents(get(row, 'Tax')) ?? 0
  let unitPrice: number | undefined
  if (total !== undefined && students.length > 0) {
    unitPrice = Math.round((total - tax) / students.length)
    notes.push({ note: `Legacy order total: $${(total / 100).toFixed(2)}`, timestamp: orderDate, type: 'payment' })
  }

  const lookup: MappedRegistration['_lookup'] = {}
  if (get(row, 'School')) lookup.school = get(row, 'School')
  if (get(row, 'Season')) lookup.season = get(row, 'Season')
  if (get(row, 'Product')) lookup.product = get(row, 'Product')

  return {
    parentFirstName: get(row, 'P/G F/N'),
    parentLastName: get(row, 'P/G L/N'),
    parentEmail: get(row, 'P/G Email').toLowerCase(),
    parentPhone: get(row, 'Phone'),
    students,
    legacyWooOrderId: orderId,
    orderStatus,
    paymentStatus: paymentStatusFor(orderStatus),
    ...(unitPrice !== undefined ? { unitPrice, gstAmount: tax } : {}),
    notes,
    _lookup: lookup,
  }
}

function validate(reg: MappedRegistration): string[] {
  const problems: string[] = []
  if (!reg.legacyWooOrderId) problems.push('missing Order ID')
  if (!reg.parentFirstName) problems.push('missing P/G F/N')
  if (!reg.parentLastName) problems.push('missing P/G L/N')
  if (!reg.parentEmail) problems.push('missing P/G Email')
  if (!reg.parentPhone) problems.push('missing Phone')
  if (reg.students.length === 0) problems.push('no students (SFN #n)')
  return problems
}

// ── Write mode ───────────────────────────────────────────────────────────────

async function writeRegistrations(regs: MappedRegistration[], fallbackProductId?: string) {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  const payload = await getPayload({ config })

  const cache = new Map<string, string | number | null>()
  async function resolve(collection: 'schools' | 'seasons' | 'products', title?: string) {
    if (!title) return null
    const key = `${collection}:${title.toLowerCase()}`
    if (!cache.has(key)) {
      const res = await payload.find({ collection, where: { title: { like: title } }, limit: 1, depth: 0 })
      cache.set(key, res.docs[0]?.id ?? null)
    }
    return cache.get(key) ?? null
  }

  let created = 0
  let skipped = 0
  let failed = 0
  for (const reg of regs) {
    const existing = await payload.find({
      collection: 'registrations',
      where: { legacyWooOrderId: { equals: reg.legacyWooOrderId } },
      limit: 1,
      depth: 0,
    })
    if (existing.totalDocs > 0) {
      console.log(`↷ #${reg.legacyWooOrderId}: already imported`)
      skipped++
      continue
    }

    const { _lookup, ...data } = reg
    const school = await resolve('schools', _lookup.school)
    const season = await resolve('seasons', _lookup.season)
    const product = (await resolve('products', _lookup.product)) ?? fallbackProductId ?? null
    if (!product) {
      console.error(`✗ #${reg.legacyWooOrderId}: no product (add a Product column or pass --product <id>)`)
      failed++
      continue
    }
    if (_lookup.school && !school) console.warn(`  #${reg.legacyWooOrderId}: school "${_lookup.school}" not found`)
    if (_lookup.season && !season) console.warn(`  #${reg.legacyWooOrderId}: season "${_lookup.season}" not found`)

    try {
      const doc = await payload.create({
        collection: 'registrations',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { ...data, school, season, product } as any,
      })
      console.log(`✓ #${reg.legacyWooOrderId} → registration ${doc.id}`)
      created++
    } catch (err) {
      console.error(`✗ #${reg.legacyWooOrderId}: ${(err as Error).message}`)
      failed++
    }
  }

  console.log(`\nCreated ${created}, skipped ${skipped}, failed ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const write = args.includes('--write')
  const productIdx = args.indexOf('--product')
  const fallbackProductId = productIdx >= 0 ? args[productIdx + 1] : undefined
  const csvPath = path.resolve(
    args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--product') ?? 'data/legacy-export.csv',
  )

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const rows = toObjects(parseCsv(fs.readFileSync(csvPath, 'utf-8')))
  if (rows.length > 0 && !('order id' in rows[0])) {
    console.error('CSV has no "Order ID" column — is this a legacy order export?')
    process.exit(1)
  }

  const valid: MappedRegistration[] = []
  const invalid: { line: number; orderId: string; problems: string[] }[] = []
  rows.forEach((row, i) => {
    const reg = mapRow(row)
    const problems = validate(reg)
    if (problems.length) invalid.push({ line: i + 2, orderId: reg.legacyWooOrderId, problems })
    else valid.push(reg)
  })

  if (!write) {
    console.log(JSON.stringify(valid, null, 2))
    console.error(`\nDry run: ${rows.length} rows → ${valid.length} valid, ${invalid.length} invalid`)
    for (const bad of invalid) console.error(`  line ${bad.line} (#${bad.orderId || '?'}): ${bad.problems.join(', ')}`)
    console.error('Re-run with --write to import.')
    return
  }

  for (const bad of invalid) console.error(`skipping line ${bad.line} (#${bad.orderId || '?'}): ${bad.problems.join(', ')}`)
  await writeRegistrations(valid, fallbackProductId)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
