import type { BeforeDocumentControlsServerProps } from 'payload'
import BulkVariationModalClient from './BulkVariationModalClient'

export async function BulkVariationModal(props: BeforeDocumentControlsServerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { payload, id } = props as any
  if (!id) return null

  const [citiesRes, schoolsRes, seasonsRes, product] = await Promise.all([
    payload.find({ collection: 'cities', limit: 300, sort: 'title' }),
    payload.find({ collection: 'schools', limit: 2000, depth: 1, sort: 'title' }),
    payload.find({ collection: 'seasons', limit: 50 }),
    payload.findByID({ collection: 'products', id, depth: 1 }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cities = citiesRes.docs.map((c: any) => ({ id: String(c.id), title: c.title as string }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schools = schoolsRes.docs.map((s: any) => ({
    id: String(s.id),
    title: s.title as string,
    cityId: String(s.city?.id ?? s.city ?? ''),
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasons = seasonsRes.docs.map((s: any) => ({ id: String(s.id), title: s.title as string }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variations = ((product?.variations ?? []) as any[]).map((v: any) => ({
    id: String(v.id ?? ''),
    cityId: String(v.city?.id ?? v.city ?? ''),
    schoolId: String(v.school?.id ?? v.school ?? ''),
    seasonId: String(v.season?.id ?? v.season ?? ''),
    price: Number(v.price ?? 0),
    capacity: Number(v.capacity ?? 0),
    schoolTitle: typeof v.school === 'object' ? (v.school?.title ?? '') : '',
    seasonTitle: typeof v.season === 'object' ? (v.season?.title ?? '') : '',
  }))

  return (
    <BulkVariationModalClient
      productId={String(id)}
      cities={cities}
      schools={schools}
      seasons={seasons}
      initialVariations={variations}
    />
  )
}

export default BulkVariationModal
