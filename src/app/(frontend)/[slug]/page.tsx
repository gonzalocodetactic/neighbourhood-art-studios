import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { BlockRenderer } from '@/components/BlockRenderer'
import { getHeaderSettings } from '@/lib/getHeaderSettings'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({ collection: 'pages', limit: 200, depth: 0 })
  return result.docs
    .filter((p) => p.slug !== 'home')
    .map((p) => ({ slug: p.slug }))
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params
  await getHeaderSettings() // warms cache for layout deduplication

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  const page = result.docs[0]
  if (!page) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout = (page.layout ?? []) as Record<string, any>[]

  return (
    <>
      {layout.map((block, i) => (
        <BlockRenderer key={block.id ?? i} block={block} />
      ))}
    </>
  )
}
