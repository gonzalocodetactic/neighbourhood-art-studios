import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  const payload = await getPayload({ config })

  // Resolve the NAS logo media ID
  const logoResult = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'NAS-png.webp' } },
    limit: 1,
  })
  const logoId = logoResult.docs[0]?.id ?? null
  console.log(`Logo media id: ${logoId ?? 'not found — will skip'}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.updateGlobal({
    slug: 'footer-settings',
    data: {
      ...(logoId ? { logo: logoId } : {}),
      logoMaxWidth: 96,

      navLinks: [
        { label: 'Home', url: '/' },
        { label: 'Programs', url: '/programs' },
        { label: 'Gallery', url: '/gallery' },
        { label: 'Camps', url: '/camps' },
        { label: 'Art Parties', url: '/art-parties' },
        { label: 'Become a Teacher', url: '/become-a-teacher' },
        { label: 'In class Workshops', url: '/in-class-workshops' },
        { label: 'Contact', url: '/contact' },
        { label: 'Register', url: '/register' },
      ],

      contactHeading: 'CONTACT US',
      location: 'Metro Vancouver, BC',
      phone: '(604) 800-7027',
      email: 'hello@neighbourhoodartstudios.com',

      socialHeading: 'CONNECT WITH US',
      socialLinks: [
        { label: 'Facebook', url: 'https://www.facebook.com/neighbourhoodartstudios', icon: 'facebook' },
        { label: 'Twitter', url: 'https://twitter.com/nasartstudios', icon: 'twitter' },
        { label: 'Instagram', url: 'https://www.instagram.com/neighbourhoodartstudios', icon: 'instagram' },
      ],

      copyrightText: `© ${new Date().getFullYear()} Neighbourhood Art Studios`,
      creditText: 'Designed by GoodTactic Media Co | Web Design | All rights reserved',
    } as any,
  })

  console.log('Footer settings seeded.')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
