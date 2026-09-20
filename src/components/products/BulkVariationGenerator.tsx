import type { AdminViewServerProps } from 'payload'
import BulkVariationGeneratorClient from './BulkVariationGeneratorClient'

export async function BulkVariationGenerator(props: AdminViewServerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { payload, docID } = props as any

  const [citiesRes, schoolsRes, seasonsRes, product] = await Promise.all([
    payload.find({ collection: 'cities', limit: 300, sort: 'title' }),
    payload.find({ collection: 'schools', limit: 2000, depth: 1, sort: 'title' }),
    payload.find({ collection: 'seasons', limit: 50 }),
    docID
      ? payload.findByID({ collection: 'products', id: docID, depth: 2 })
      : Promise.resolve(null),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cities = citiesRes.docs.map((c: any) => ({ id: c.id, title: c.title }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schools = schoolsRes.docs.map((s: any) => ({
    id: s.id,
    title: s.title,
    cityId: String(s.city?.id ?? s.city ?? ''),
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fall2026 = seasonsRes.docs.find((s: any) => s.title === 'Fall 2026')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingVariations = ((product?.variations ?? []) as any[]).map((v: any) => ({
    id: String(v.id ?? ''),
    schoolId: String(v.school?.id ?? v.school ?? ''),
    seasonId: String(v.season?.id ?? v.season ?? ''),
    price: Number(v.price ?? 0),
    capacity: Number(v.capacity ?? 0),
    dayOfWeek: v.dayOfWeek || undefined,
    timeSlot: v.timeSlot || undefined,
    schoolTitle: typeof v.school === 'object' ? (v.school?.title ?? '') : '',
  }))

  return (
    <BulkVariationGeneratorClient
      productId={docID ?? null}
      cities={cities}
      schools={schools}
      fall2026SeasonId={fall2026 ? String(fall2026.id) : null}
      existingVariations={existingVariations}
    />
  )
}

export default BulkVariationGenerator
