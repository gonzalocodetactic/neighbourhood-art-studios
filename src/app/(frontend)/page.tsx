import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { BlockRenderer } from '@/components/BlockRenderer'
import { getHeaderSettings } from '@/lib/getHeaderSettings'

export default async function HomePage() {
  await getHeaderSettings() // warms cache for layout deduplication

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 2,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout = (result.docs[0]?.layout ?? []) as Record<string, any>[]

  return (
    <>
      {layout.map((block, i) => (
        <BlockRenderer key={block.id ?? i} block={block} />
      ))}
    </>
  )
}
