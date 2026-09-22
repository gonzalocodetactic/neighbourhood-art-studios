import { getPayload } from 'payload'
import config from '../payload.config'

const IMAGES = [
  {
    url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/1.jpg',
    alt: 'Kids painting at Neighbourhood Art Studios',
    name: '1.jpg',
  },
  {
    url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/6.jpg',
    alt: 'Art class in session',
    name: '6.jpg',
  },
  {
    url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/5.jpg',
    alt: 'Student artwork display',
    name: '5.jpg',
  },
  {
    url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/8.jpg',
    alt: 'After-school art programs for kids',
    name: '8.jpg',
  },
  {
    url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/7.jpg',
    alt: 'Young artist at work',
    name: '7.jpg',
  },
  {
    url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/10.jpg',
    alt: 'Painting techniques for children',
    name: '10.jpg',
  },
]

const REAL_TESTIMONIALS = [
  {
    quote:
      'Our daughters have been students at Neighbourhood Art Studios for eight years. Chris and his staff continue to inspire them while teaching the technical and creative skills necessary to express themselves through a variety of art forms including sketching, painting, and sculpting.',
    clientName: 'Natasha Davies',
    clientSubtext: 'Parent of Sasha (almost 14) and Eva (almost 12)',
  },
  {
    quote:
      'My daughter started classes at age five, almost seven years ago. She has flourished as both an artist and a person. The instructors are incredibly talented and nurturing — she absolutely loves going every week.',
    clientName: 'Anna Hewsten',
    clientSubtext: 'Parent',
  },
  {
    quote:
      'Our son has been attending for two years and loves it! He has learned so much about art techniques and has grown in confidence. The teachers are patient and make it so fun.',
    clientName: 'Ped Naimi',
    clientSubtext: 'Parent',
  },
  {
    quote:
      "I love the teaching here. I've made so many friends and I look forward to coming every week. My favourite thing to draw is animals and portraits.",
    clientName: 'Erin',
    clientSubtext: 'Neighbourhood Art Studios Student',
  },
  {
    quote:
      "I've learned to draw portraits and realistic imagery in ways I never thought I could. The classes have made me a much better artist and I enjoy every session.",
    clientName: 'Ellen',
    clientSubtext: 'Art Student',
  },
]

async function downloadImage(url: string): Promise<{ data: Buffer; size: number; mimeType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  const data = Buffer.from(arrayBuffer)
  const mimeType = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
  return { data, size: data.byteLength, mimeType }
}

async function main() {
  const payload = await getPayload({ config })

  // ── Upload content images ──────────────────────────────────────────────────

  console.log('\n── Uploading images ──')
  const mediaIds: Record<string, number> = {}

  for (const img of IMAGES) {
    // Check if already uploaded
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: img.name } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      console.log(`  [skip] ${img.name} → id ${existing.docs[0].id}`)
      mediaIds[img.name] = existing.docs[0].id as number
      continue
    }

    try {
      const { data, size, mimeType } = await downloadImage(img.url)
      const doc = await payload.create({
        collection: 'media',
        data: { alt: img.alt },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        file: { data, mimetype: mimeType, name: img.name, size } as any,
      })
      mediaIds[img.name] = doc.id as number
      console.log(`  [+] ${img.name} → id ${doc.id}`)
    } catch (err) {
      console.error(`  [err] ${img.name}:`, err)
    }
  }

  // ── Update CascadingMediaContent blocks ────────────────────────────────────

  console.log('\n── Updating home page ──')

  const pageResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    depth: 2,
    limit: 1,
  })
  const page = pageResult.docs[0]
  if (!page) {
    console.error('Home page not found!')
    process.exit(1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout = (page.layout ?? []) as Record<string, any>[]

  // Update each block in the layout
  const updatedLayout = layout.map((block) => {
    if (block.blockType === 'cascadingMediaContent') {
      if (block.direction === 'imageLeft') {
        const ids = ['1.jpg', '6.jpg', '5.jpg'].map((n) => mediaIds[n]).filter(Boolean)
        if (ids.length > 0) {
          console.log(`  cascadingMediaContent imageLeft → images [${ids.join(', ')}]`)
          return { ...block, images: ids.map((id) => ({ image: id })) }
        }
      } else if (block.direction === 'textLeft') {
        const ids = ['8.jpg', '7.jpg', '10.jpg'].map((n) => mediaIds[n]).filter(Boolean)
        if (ids.length > 0) {
          console.log(`  cascadingMediaContent textLeft → images [${ids.join(', ')}]`)
          return { ...block, images: ids.map((id) => ({ image: id })) }
        }
      }
    }

    if (block.blockType === 'testimonialsSlider') {
      console.log('  testimonialsSlider → 5 real testimonials')
      return { ...block, testimonials: REAL_TESTIMONIALS }
    }

    return block
  })

  await payload.update({
    collection: 'pages',
    id: page.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { layout: updatedLayout } as any,
  })

  console.log('  home page updated')

  // ── Update header logo if we haven't already ──────────────────────────────

  const headerSettings = await payload.findGlobal({ slug: 'header-settings', depth: 1 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hs = headerSettings as any
  if (!hs?.logo || typeof hs.logo !== 'object') {
    // Try to find the NAS logo in media
    const logoResult = await payload.find({
      collection: 'media',
      where: { filename: { contains: 'NAS-png' } },
      limit: 1,
    })
    if (logoResult.docs.length > 0) {
      await payload.updateGlobal({
        slug: 'header-settings',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { logo: logoResult.docs[0].id } as any,
      })
      console.log(`\n── Logo set to media id ${logoResult.docs[0].id}`)
    }
  } else {
    console.log('\n── Logo already set, skipping')
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
