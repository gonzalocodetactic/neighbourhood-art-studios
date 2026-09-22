import { getPayload } from 'payload'
import config from '../payload.config'

function lexical(...paragraphs: string[]) {
  return {
    root: {
      type: 'root', format: '', indent: 0, version: 1,
      children: paragraphs.map(text => ({
        type: 'paragraph', version: 1, format: '', indent: 0, direction: 'ltr',
        children: [{ type: 'text', version: 1, format: 0, style: '', mode: 'normal', detail: 0, text }],
      })),
    },
  }
}

async function main() {
  const payload = await getPayload({ config })

  // Download 46.jpg (hero + collage anchor image)
  let id46: number
  const hit = await payload.find({ collection: 'media', where: { filename: { equals: '46.jpg' } }, limit: 1 })
  if (hit.docs.length) {
    id46 = hit.docs[0].id as number
    console.log(`[skip] 46.jpg → id ${id46}`)
  } else {
    const res = await fetch('https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/46.jpg')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = Buffer.from(await res.arrayBuffer())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await payload.create({ collection: 'media', data: { alt: 'Art instructor with students' }, file: { data, mimetype: 'image/jpeg', name: '46.jpg', size: data.byteLength } as any })
    id46 = doc.id as number
    console.log(`[+] 46.jpg → id ${id46}`)
  }

  // 35.jpg = id 14, 37.jpg = id 20 — already in media
  const id35 = 14
  const id37 = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = [
    {
      blockType: 'hero',
      title: 'BECOME A TEACHER',
      subtitle: 'Love Teaching Art',
      ctaLabel: 'Contact Us',
      ctaLink: '/contact',
      backgroundImage: id46,
    },
    {
      blockType: 'cascadingMediaContent',
      direction: 'imageLeft',
      subtitle: 'Join Our Team',
      title: 'Love Teaching Art?',
      images: [{ image: id46 }, { image: id35 }, { image: id37 }],
      paragraph: lexical(
        'We have an opportunity for you! Neighbourhood Art Studios is looking for part-time art instructors!!',
        'We are looking for someone who would love to teach art to school-age children. The classes are only 1.5 hours long and are offered every day right after school from 2:45–4:15pm. You can pick the days you\'d like to work.',
        'The classes are offered in elementary schools, mainly in Surrey and sometimes in Richmond and Burnaby. The applicant needs to have an art background and some experience working with children. We will provide the lesson plan, all the art supplies and materials.',
      ),
    },
    {
      blockType: 'callToAction',
      heading: 'Ready to Inspire Young Artists?',
      description: 'Flexible part-time hours · All supplies provided · Work in schools near you',
      buttonText: 'Contact Us',
      buttonLink: '/contact',
      backgroundColor: '#3B4BC8',
    },
    {
      blockType: 'footerCta',
      topTagline: 'Join the Team',
      headline: 'Neighbourhood Art Studios is Waiting For You.',
      primaryCtaLabel: 'Start Taking Your Artist Talent To The Next Level',
      primaryCtaLink: '/contact',
    },
  ]

  const result = await payload.find({ collection: 'pages', where: { slug: { equals: 'become-a-teacher' } }, limit: 1 })
  const page = result.docs[0]
  if (!page) throw new Error('Page not found')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.update({ collection: 'pages', id: page.id, data: { layout } as any })
  console.log(`Become a Teacher page (id ${page.id}) updated — ${layout.length} blocks`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
