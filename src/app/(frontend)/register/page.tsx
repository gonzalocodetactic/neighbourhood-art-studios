import configPromise from '@payload-config'
import { getPayload } from 'payload'
import RegisterClient, { type RegisterPageData } from './RegisterClient'

// Safely coerce a relationship field (populated obj or raw ID) to its ID
function getId(val: unknown): number | string {
  if (val && typeof val === 'object' && 'id' in val) return (val as { id: number | string }).id
  return val as number | string
}

export default async function RegisterPage() {
  const payload = await getPayload({ config: configPromise })

  // ── parallel fetches ─────────────────────────────────────────────────────
  const [citiesRes, schoolsRes, seasonsRes, productsRes, regsRes] = await Promise.all([
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
  ])

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

  // ── Flatten product variations ────────────────────────────────────────────
  const variations: RegisterPageData['variations'] = []
  for (const product of productsRes.docs) {
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
              fieldName: f.fieldName ?? '',
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
        dayOfWeek: v.dayOfWeek || undefined,
        timeSlot: v.timeSlot || undefined,
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

  return (
    <RegisterClient
      cities={cities}
      schools={schools}
      seasons={seasons}
      variations={variations}
    />
  )
}
