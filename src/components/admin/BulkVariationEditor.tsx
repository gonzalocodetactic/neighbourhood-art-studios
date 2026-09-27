import type { AdminViewServerProps } from 'payload'
import { can } from '@/access'
import BulkVariationEditorClient from './BulkVariationEditorClient'
import { NotAllowed } from './NotAllowed'

export async function BulkVariationEditor(props: AdminViewServerProps) {
  if (!(await can(props.initPageResult.req, 'products', 'update'))) {
    return <NotAllowed what="bulk-editing product variations" />
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { payload } = props as any

  const [citiesRes, schoolsRes, seasonsRes] = await Promise.all([
    payload.find({ collection: 'cities', limit: 300, sort: 'title' }),
    payload.find({ collection: 'schools', limit: 2000, depth: 1, sort: 'title' }),
    payload.find({ collection: 'seasons', limit: 50 }),
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
  const seasons = seasonsRes.docs.map((s: any) => ({ id: s.id, title: s.title }))

  return (
    <BulkVariationEditorClient
      cities={cities}
      schools={schools}
      seasons={seasons}
    />
  )
}

export default BulkVariationEditor
