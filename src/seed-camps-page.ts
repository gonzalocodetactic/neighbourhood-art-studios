import { getPayload } from 'payload'
import config from '../payload.config'

const CAMP_IMAGES = [
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/36.jpg', name: '36.jpg', alt: 'Kids at summer art camp' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/33.jpg', name: '33.jpg', alt: 'Art camp painting activity' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/39.jpg', name: '39.jpg', alt: 'Children creating art at camp' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/50.jpg', name: '50.jpg', alt: 'Spring break art camp' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/45.jpg', name: '45.jpg', alt: 'Summer camp art project' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/37.jpg', name: '37.jpg', alt: 'Camp art activity with clay' },
]

async function uploadImage(payload: Awaited<ReturnType<typeof getPayload>>, img: (typeof CAMP_IMAGES)[0]) {
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: img.name } }, limit: 1 })
  if (existing.docs.length > 0) {
    console.log(`  [skip] ${img.name} → id ${existing.docs[0].id}`)
    return existing.docs[0].id as number
  }
  const res = await fetch(img.url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${img.url}`)
  const data = Buffer.from(await res.arrayBuffer())
  const mimeType = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await payload.create({ collection: 'media', data: { alt: img.alt }, file: { data, mimetype: mimeType, name: img.name, size: data.byteLength } as any })
  console.log(`  [+]   ${img.name} → id ${doc.id}`)
  return doc.id as number
}

async function main() {
  const payload = await getPayload({ config })

  console.log('\n── Uploading camp images ──')
  const ids: Record<string, number> = {}
  for (const img of CAMP_IMAGES) ids[img.name] = await uploadImage(payload, img)

  // header_camps.webp is already in media (id 10) — use as hero bg
  const heroBgId = 10

  console.log('\n── Building Camps page layout ──')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = [
    // 1. Hero
    {
      blockType: 'hero',
      title: 'Camps',
      subtitle: 'Spring Break & Summer Art Camp for ages 6–11. A full week of creative fun — all art supplies included.',
      ctaLabel: 'Register Now',
      ctaLink: '/register',
      backgroundImage: heroBgId,
    },

    // 2. Highlight callout — age & overview
    {
      blockType: 'highlightCallout',
      backgroundColor: '#3B4BC8',
      text: 'For ages 6 to 12 · Acrylic paints · Watercolours · Clay · Oil Pastels · All supplies included — just bring lunch and a water bottle.',
      ctaLabel: 'Register Now',
      ctaLink: '/register',
    },

    // 3. Cascading media — "What to Expect" with 3 camp photos
    {
      blockType: 'cascadingMediaContent',
      direction: 'imageLeft',
      subtitle: 'What to Expect',
      title: 'A Full Week of Art Adventure',
      images: [
        { image: ids['36.jpg'] },
        { image: ids['33.jpg'] },
        { image: ids['39.jpg'] },
      ],
    },

    // 4. Feature grid — camp programs
    {
      blockType: 'featureGrid',
      title: 'Our Camp Programs',
      features: [
        {
          icon: ids['50.jpg'],
          title: 'Spring Break Camp',
          description: 'One action-packed week during Spring Break. Children explore painting, clay, and mixed media in a neighbourhood school near you.',
        },
        {
          icon: ids['45.jpg'],
          title: 'Summer Art Camp',
          description: 'Multiple weeks throughout the summer. Each week is a self-contained adventure — register for one week or all of them!',
        },
        {
          icon: ids['37.jpg'],
          title: 'Day Camps',
          description: 'Drop-in day camp sessions for ages 6–11. A great option for busy families who need flexible scheduling.',
        },
      ],
    },

    // 5. CTA — closing call to register
    {
      blockType: 'callToAction',
      heading: 'Neighbourhood Art Studios is Waiting For You.',
      description: 'Start Taking Your Artist Talent To The Next Level',
      buttonText: 'Register Now',
      buttonLink: '/register',
      backgroundColor: '#1a1a2e',
    },
  ]

  const pageResult = await payload.find({ collection: 'pages', where: { slug: { equals: 'camps' } }, limit: 1 })
  const page = pageResult.docs[0]
  if (!page) throw new Error('Camps page not found')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.update({ collection: 'pages', id: page.id, data: { layout } as any })
  console.log(`  Camps page (id ${page.id}) updated — ${layout.length} blocks`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
