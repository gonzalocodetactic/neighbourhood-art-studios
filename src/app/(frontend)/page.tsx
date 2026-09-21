import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { BlockRenderer } from '@/components/BlockRenderer'
import { getHeaderSettings } from '@/lib/getHeaderSettings'

// ── Demo blocks — rendered when no "home" page exists in Payload yet ─────────
const DEMO_LAYOUT = [
  {
    blockType: 'hero',
    id: 'demo-hero',
    title: 'We Find, Encourage & Develop Artistic Talent',
    subtitle:
      'Our after-school art programs ignite creativity in students, teaching fundamentals and helping them develop skills across a variety of mediums.',
    ctaLabel: 'Register Now',
    ctaLink: '/register',
    backgroundImage: null,
  },
  {
    blockType: 'highlightCallout',
    id: 'demo-callout',
    backgroundColor: '#3B4BC8',
    text: 'Book our engaging painting workshops and transform your space into an art studio!',
    ctaLabel: 'Learn More',
    ctaLink: '/workshops',
  },
  {
    blockType: 'cascadingMediaContent',
    id: 'demo-cascade-1',
    subtitle: 'Who We Are',
    title: 'Neighborhood Art Studios',
    paragraph: null,
    direction: 'imageLeft',
    images: [],
  },
  {
    blockType: 'cascadingMediaContent',
    id: 'demo-cascade-2',
    subtitle: 'For Every Artist',
    title: 'For Every Artist',
    paragraph: null,
    direction: 'textLeft',
    images: [],
  },
  {
    blockType: 'testimonialsSlider',
    id: 'demo-testimonials',
    subtitle: 'Testimonials',
    title: 'What Parents & Our Students Say',
    testimonials: [
      {
        id: 't1',
        quote:
          'Our daughters have been students at Neighbourhood Art Studios for eight years. Chris and his staff continue to inspire them while teaching the technical and creative skills necessary to express themselves through a variety of art forms including sketching, painting, and sculpting.',
        clientName: 'Natasha Devio',
        clientSubtext: 'The Devio parents of Tasha (almost 12) and Eva (almost 12)',
      },
      {
        id: 't2',
        quote:
          'The instructors are passionate, patient, and incredibly talented. My son has grown so much as an artist — he looks forward to every single class.',
        clientName: 'Maria Chen',
        clientSubtext: 'Parent of Lucas, age 9',
      },
      {
        id: 't3',
        quote:
          'Neighbourhood Art Studios has been a transformative experience for our family. The nurturing environment and expert instruction are second to none.',
        clientName: 'James Patel',
        clientSubtext: 'Parent of two NAS students',
      },
    ],
  },
  {
    blockType: 'programFlipCards',
    id: 'demo-programs',
    subtitle: 'Discover Our Programs',
    title: 'Our Programs',
    cards: [
      {
        id: 'c1',
        backgroundImage: null,
        cardTitle: 'Camps',
        cardSubtitle: 'Ages 6–12',
        hoverDescription:
          'Week-long art camps during summer and school breaks. Students explore painting, drawing, sculpture, and mixed media in a fun, structured environment.',
        link: '/camps',
      },
      {
        id: 'c2',
        backgroundImage: null,
        cardTitle: 'Art Parties',
        cardSubtitle: 'Kids Art',
        hoverDescription:
          'Celebrate birthdays and special events with a hands-on art party led by our experienced instructors. Perfect for groups of 8–20 children.',
        link: '/art-parties',
      },
    ],
  },
  {
    blockType: 'footerCta',
    id: 'demo-footer-cta',
    backgroundImage: null,
    topTagline: 'Neighbourhood Art Studios is Working For You',
    headline: 'Start Taking Your Artist Talent To The Next Level',
    primaryCtaLabel: 'Register Now',
    primaryCtaLink: '/register',
  },
]

export default async function HomePage() {
  let layout = DEMO_LAYOUT

  try {
    await getHeaderSettings() // warms the request cache for layout deduplication
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      limit: 1,
      depth: 2,
    })

    const page = result.docs[0]
    if (page?.layout && page.layout.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layout = page.layout as any
    }
  } catch {
    // Payload not ready / table not created yet — fall through to demo layout
  }

  return (
    <>
      {layout.map((block, i) => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <BlockRenderer key={(block as any).id ?? i} block={block as Record<string, any>} />
      ))}
    </>
  )
}
