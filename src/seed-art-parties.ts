import { getPayload } from 'payload'
import config from '../payload.config'

const PARTY_IMAGES = [
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/52.jpg', name: '52.jpg', alt: 'Art party painting session' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/41.jpg', name: '41.jpg', alt: 'Group art party event' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/48.jpg', name: '48.jpg', alt: 'Art party canvas painting' },
  { url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/51.jpg', name: '51.jpg', alt: 'Birthday art party for kids' },
]

async function upload(payload: Awaited<ReturnType<typeof getPayload>>, img: (typeof PARTY_IMAGES)[0]) {
  const hit = await payload.find({ collection: 'media', where: { filename: { equals: img.name } }, limit: 1 })
  if (hit.docs.length) { console.log(`  [skip] ${img.name} → id ${hit.docs[0].id}`); return hit.docs[0].id as number }
  const res = await fetch(img.url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${img.url}`)
  const data = Buffer.from(await res.arrayBuffer())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await payload.create({ collection: 'media', data: { alt: img.alt }, file: { data, mimetype: res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg', name: img.name, size: data.byteLength } as any })
  console.log(`  [+]   ${img.name} → id ${doc.id}`)
  return doc.id as number
}

async function main() {
  const payload = await getPayload({ config })

  console.log('\n── Uploading art party images ──')
  const ids: Record<string, number> = {}
  for (const img of PARTY_IMAGES) ids[img.name] = await upload(payload, img)

  // id 13 = 51.webp (already in media — use as 5th slider image)
  const extra51 = 13

  const slides = [
    { image: ids['52.jpg'] },
    { image: ids['41.jpg'] },
    { image: ids['48.jpg'] },
    { image: ids['51.jpg'] || extra51 },
  ].filter(s => s.image)

  console.log('\n── Building Art Parties page layout ──')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = [
    // 1. Horizontal image slider
    {
      blockType: 'horizontalSlider',
      slides,
      speed: 28,
      imageHeight: 360,
    },

    // 2. Highlight callout — occasions banner
    {
      blockType: 'highlightCallout',
      backgroundColor: '#3B4BC8',
      text: 'Birthday Parties · Ladies Night Out · Bachelorette Parties · Company Events · Friends\' Get-Together · and more!',
    },

    // 3. Feature grid — the 3 core selling points
    {
      blockType: 'featureGrid',
      title: 'Neighbourhood Art Studios Art Parties!',
      features: [
        {
          icon: ids['52.jpg'],
          title: 'We Come to You',
          description: 'We come to your home, school, community centre, office, restaurant, church, or business. We design a painting to fit your theme — or choose from one of ours.',
        },
        {
          icon: ids['41.jpg'],
          title: 'Everything Included',
          description: 'Step-by-step instruction for each artist, canvases, paints, brushes, water cups, tablecloths, and early arrival to set up. You just provide tables, chairs, and guests!',
        },
        {
          icon: ids['48.jpg'],
          title: 'Pricing',
          description: 'Children: $35 per artist · Adults: $40 per artist · Book one month in advance to reserve your spot.',
        },
      ],
    },

    // 4. CTA — register
    {
      blockType: 'callToAction',
      heading: 'Add a Little Creative Fun to Any Occasion',
      description: 'We offer Art Parties for all ages. Book one month in advance to reserve your spot!',
      buttonText: 'Register Now',
      buttonLink: '/register',
      backgroundColor: '#3B4BC8',
    },

    // 5. Footer CTA
    {
      blockType: 'footerCta',
      topTagline: 'Ready to Get Creative?',
      headline: 'Neighbourhood Art Studios is Waiting For You.',
      primaryCtaLabel: 'Start Taking Your Artist Talent To The Next Level',
      primaryCtaLink: '/register',
    },
  ]

  const result = await payload.find({ collection: 'pages', where: { slug: { equals: 'art-parties' } }, limit: 1 })
  const page = result.docs[0]
  if (!page) throw new Error('Art Parties page not found')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.update({ collection: 'pages', id: page.id, data: { layout } as any })
  console.log(`  Art Parties page (id ${page.id}) updated — ${layout.length} blocks`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
