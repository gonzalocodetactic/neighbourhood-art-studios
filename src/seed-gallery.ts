import { getPayload } from 'payload'
import config from '../payload.config'

// Strip WP thumbnail size suffix (-600x400, -486x400, etc.) to get clean filename
function toFilename(url: string): string {
  const base = url.split('/').pop() ?? url
  return base.replace(/-\d+x\d+(\.\w+)$/, '$1')
}

const RAW_URLS = [
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_5352-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0615-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0614-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0613-600x398.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0612-486x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0611-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0610-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0609-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0608-600x310.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0607-600x280.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0606-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0605-600x348.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0604-600x306.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0603-600x338.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0602-482x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0601-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0600-588x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0599-600x310.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/9ed48d81-d5ab-4b37-b0a2-a81494e357ff-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/a1985d78-8304-4a21-9585-e2d2576d4bf0-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/f53b603d-3a49-4996-8b61-250fecb91959-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/af76e047-686f-4bd8-bb5a-5e1c80553166-600x360.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/37d7b810-8f4e-497b-a0bb-c7fea48c98a5-600x360.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/903a0d0e-f700-4a36-8df9-77afcd0d3bc0-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/e5bd999a-99e5-4563-8082-58f3d143fa02-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/a4d05600-260c-48ad-922e-66b23b13f98f-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/1b42a636-fd33-4a66-b271-27003c545bb1-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/7bb8f0ca-f1ea-46e9-b030-c2d1f2fd53c2-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/757ebd04-ad53-45e0-b7ca-5f9627a0969e-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/9feb8e91-6303-488d-8cb8-2469bc094c89-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/0985ee38-4c99-42b6-9402-85f9c244b5d9-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/4ad327a9-e742-45f1-9548-d645d1edeac7-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/5a3ef90a-9a26-4fe8-a09c-a2ad616e4fa6-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/2fad817f-3864-4d20-8202-a0471ebef1fe-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/6b578b76-6d5f-421c-882a-d810456609c8-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/6da790ee-971f-46dd-a678-e9dddfd32788-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/IMG_0579-536x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/e3f28bbb-7b86-44fb-92c9-2c73ec2bd8c4-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/42952cda-4421-4cbc-8d86-27ecb73d1b55-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/60eb6bff-8b8e-4b3c-8c71-693d1f7f0721-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/2e67526d-fd5e-40a4-834f-e364c023c1a5-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/ccc3f1a7-e66d-4b79-a34f-039bdf24c695-600x400.jpg',
  'https://neighbourhoodartstudios.com/wp-content/uploads/2024/01/f0322fe3-57c3-4012-8bf4-ac870c5c0141-600x400.jpg',
]

async function upload(payload: Awaited<ReturnType<typeof getPayload>>, url: string): Promise<number> {
  const name = toFilename(url)
  const hit = await payload.find({ collection: 'media', where: { filename: { equals: name } }, limit: 1 })
  if (hit.docs.length) { process.stdout.write('.'); return hit.docs[0].id as number }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  const data = Buffer.from(await res.arrayBuffer())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await payload.create({ collection: 'media', data: { alt: 'NAS gallery photo' }, file: { data, mimetype: 'image/jpeg', name, size: data.byteLength } as any })
  process.stdout.write('+')
  return doc.id as number
}

async function main() {
  const payload = await getPayload({ config })

  process.stdout.write(`Uploading ${RAW_URLS.length} gallery images: `)
  const mediaIds: number[] = []
  for (const url of RAW_URLS) mediaIds.push(await upload(payload, url))
  console.log(` done`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = [
    {
      blockType: 'hero',
      title: 'Gallery',
      subtitle: 'A collection of artwork and memories from our students and classes across Metro Vancouver.',
      backgroundImage: mediaIds[0],
    },
    {
      blockType: 'lightboxGallery',
      title: 'Student Artwork & Events',
      images: mediaIds.map(id => ({ image: id })),
    },
    {
      blockType: 'footerCta',
      topTagline: 'Inspired by What You See?',
      headline: 'Neighbourhood Art Studios is Waiting For You.',
      primaryCtaLabel: 'Start Taking Your Artist Talent To The Next Level',
      primaryCtaLink: '/register',
    },
  ]

  const result = await payload.find({ collection: 'pages', where: { slug: { equals: 'gallery' } }, limit: 1 })
  const page = result.docs[0]
  if (!page) throw new Error('Gallery page not found')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.update({ collection: 'pages', id: page.id, data: { layout } as any })
  console.log(`Gallery page (id ${page.id}) updated — ${layout.length} blocks, ${mediaIds.length} images`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
