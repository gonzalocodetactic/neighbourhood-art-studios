import { Suspense } from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import RegisterClient, { type RegisterPageData } from './RegisterClient'
import { getPaymentSettings } from '@/lib/getPaymentSettings'

// Render per request so enrollment counts and product changes show without a rebuild
export const dynamic = 'force-dynamic'

function getId(val: unknown): number | string {
  if (val && typeof val === 'object' && 'id' in val) return (val as { id: number | string }).id
  return val as number | string
}

function getTitle(val: unknown): string {
  if (val && typeof val === 'object' && 'title' in val) return (val as { title: string }).title ?? ''
  return ''
}

function getName(val: unknown): string {
  if (val && typeof val === 'object' && 'name' in val) return (val as { name: string }).name ?? ''
  return ''
}

function getLabel(val: unknown): string {
  if (val && typeof val === 'object' && 'label' in val) return (val as { label: string }).label ?? ''
  return ''
}

// Checkout, saved registrations and re-enroll pre-fill all use these exact keys.
// Match a form's field name to one of them regardless of case/spacing ("Age" → "age").
const STUDENT_KEYS = ['firstName', 'lastName', 'age', 'gender', 'grade', 'teacherName', 'divisionNumber']

function studentKey(fieldName: string): string {
  const normalized = fieldName.replace(/\s+/g, '').toLowerCase()
  return STUDENT_KEYS.find((k) => k.toLowerCase() === normalized) ?? fieldName
}

export default async function RegisterPage() {
  const payload = await getPayload({ config: configPromise })

  // ── parallel fetches ─────────────────────────────────────────────────────
  const [citiesRes, schoolsRes, seasonsRes, productsRes, regsRes, gstSettings, termsRes, locationsRes, timeslotsRes, campWeeksRes] = await Promise.all([
    payload.find({ collection: 'cities', limit: 300, sort: 'title' }),
    payload.find({
      collection: 'schools',
      limit: 2000,
      depth: 1, // populate city relationship
      sort: 'title',
    }),
    payload.find({
      collection: 'seasons',
      limit: 100,
      where: { active: { equals: true } },
      sort: '-title',
    }),
    payload.find({
      collection: 'products',
      limit: 200,
      depth: 2, // populate city/school/season inside variations
    }),
    // Fetch active registrations (depth:0 — we only need raw IDs for counting)
    payload.find({
      collection: 'registrations',
      limit: 10000,
      depth: 0,
      where: {
        and: [
          { paymentStatus: { not_in: ['refunded'] } },
          { attendanceStatus: { not_in: ['cancelled'] } },
        ],
      },
    }),
    getPaymentSettings(),
    payload.find({ collection: 'pages', where: { slug: { equals: 'terms-and-conditions' } }, limit: 1, depth: 0 }),
    payload.find({ collection: 'locations', limit: 200, sort: 'name' }).catch(() => ({ docs: [] })),
    payload.find({ collection: 'timeslots', limit: 100, sort: 'label' }).catch(() => ({ docs: [] })),
    payload.find({ collection: 'camp-weeks', limit: 200, sort: 'startDate' }).catch(() => ({ docs: [] })),
  ])

  // Products ticked "Hide from Register Page" in the admin are left off entirely
  const products = productsRes.docs.filter((p) => !p.hideFromRegister)

  // ── Build enrollment count map keyed by `productId-schoolId-seasonId` ────
  const enrolledMap = new Map<string, number>()
  for (const reg of regsRes.docs) {
    const key = `${reg.product}-${reg.school}-${reg.season}`
    enrolledMap.set(key, (enrolledMap.get(key) ?? 0) + 1)
  }

  // ── Normalize cities ──────────────────────────────────────────────────────
  const cities: RegisterPageData['cities'] = citiesRes.docs.map((c) => ({
    id: c.id,
    title: c.title,
  }))

  // ── Normalize schools ─────────────────────────────────────────────────────
  const schools: RegisterPageData['schools'] = schoolsRes.docs.map((s) => ({
    id: s.id,
    title: s.title,
    cityId: getId(s.city),
  }))

  // ── Normalize seasons ─────────────────────────────────────────────────────
  const seasons: RegisterPageData['seasons'] = seasonsRes.docs.map((s) => ({
    id: s.id,
    title: s.title,
  }))

  // ── Normalize camp data ───────────────────────────────────────────────────
  const campLocations: RegisterPageData['campLocations'] = (locationsRes.docs as any[]).map((l) => ({
    id: l.id,
    name: l.name,
    address: l.address ?? undefined,
    city: l.city ?? undefined,
  }))

  const campTimeslots: RegisterPageData['campTimeslots'] = (timeslotsRes.docs as any[]).map((t) => ({
    id: t.id,
    label: t.label,
  }))

  const campWeeks: RegisterPageData['campWeeks'] = (campWeeksRes.docs as any[]).map((w) => ({
    id: w.id,
    label: w.label,
    startDate: w.startDate ?? undefined,
    endDate: w.endDate ?? undefined,
  }))

  // Camp / session variations live inside camp-type products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campSessions: RegisterPageData['campSessions'] = (products as any[])
    .filter((p) => p.productType === 'camp')
    .flatMap((p) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.variations ?? []).map((v: any) => ({
        id: v.id,
        productId: p.id,
        productTitle: p.title,
        locationId: getId(v.location),
        locationName: getName(v.location),
        timeslotId: getId(v.timeslot),
        timeslotLabel: getLabel(v.timeslot),
        campWeekId: getId(v.campWeek),
        campWeekLabel: getLabel(v.campWeek),
        price: v.price ?? 225,
        capacity: v.capacity ?? 20,
        registeredCount: v.registeredCount ?? 0,
        status: v.status ?? 'open',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        checkoutFields: (p.checkoutFields ?? []).map((f: any) => ({
          label: f.label,
          fieldType: f.fieldType ?? 'text',
          required: f.required ?? false,
        })),
      })),
    )

  // ── Flatten product variations ────────────────────────────────────────────
  const variations: RegisterPageData['variations'] = []
  for (const product of products) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((product as any).productType === 'camp') continue
    for (const v of product.variations ?? []) {
      const cityId = getId(v.city)
      const schoolId = getId(v.school)
      const seasonId = getId(v.season)
      const key = `${product.id}-${schoolId}-${seasonId}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const form = (product as any).registrationForm as any
      const perStudentFields: RegisterPageData['variations'][number]['perStudentFields'] =
        Array.isArray(form?.perStudentFields) && form.perStudentFields.length > 0
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            form.perStudentFields.map((f: any) => ({
              label: f.label ?? '',
              fieldName: studentKey(f.fieldName ?? ''),
              fieldType: (f.fieldType ?? 'text') as 'text' | 'number' | 'select' | 'checkbox',
              required: f.required ?? false,
              placeholder: f.placeholder || undefined,
              width: f.width || undefined,
              selectOptions: Array.isArray(f.selectOptions)
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  f.selectOptions.map((o: any) => ({ label: o.label ?? '', value: o.value ?? '' }))
                : undefined,
            }))
          : null

      variations.push({
        variationKey: key,
        productId: product.id,
        productTitle: product.title,
        cityId,
        schoolId,
        seasonId,
        price: v.price ?? 0,
        capacity: v.capacity ?? 20,
        enrolled: enrolledMap.get(key) ?? 0,
        schoolName: getTitle(v.school),
        seasonName: getTitle(v.season),
        perStudentFields,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        checkoutFields: (product.checkoutFields ?? []).map((f: any) => ({
          label: f.label,
          fieldType: f.fieldType ?? 'text',
          required: f.required ?? false,
        })),
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const termsContent: string = (termsRes.docs[0] as any)?.termsContent ?? ''

  return (
    <Suspense fallback={null}>
      <RegisterClient
        cities={cities}
        schools={schools}
        seasons={seasons}
        variations={variations}
        gstSettings={gstSettings}
        termsContent={termsContent}
        campLocations={campLocations}
        campTimeslots={campTimeslots}
        campWeeks={campWeeks}
        campSessions={campSessions}
      />
    </Suspense>
  )
}
