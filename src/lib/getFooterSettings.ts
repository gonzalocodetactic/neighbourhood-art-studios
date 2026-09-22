import { cache } from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { LogoMedia } from './getHeaderSettings'

export type FooterNavItem = { label: string; url: string }
export type FooterSocialLink = { label: string; url: string; icon: string }

export type FooterData = {
  logo: LogoMedia | null
  logoMaxWidth: number
  navLinks: FooterNavItem[]
  contactHeading: string
  location: string
  phone: string
  email: string
  socialHeading: string
  socialLinks: FooterSocialLink[]
  copyrightText: string
  creditText: string
}

export const getFooterSettings = cache(async (): Promise<FooterData | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (await payload.findGlobal({ slug: 'footer-settings', depth: 1 })) as any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toUrl = (item: any): string =>
      item.url ||
      (item.page && typeof item.page === 'object' ? `/${item.page.slug}` : '') ||
      '#'

    const rawLogo = s?.logo
    const logo: LogoMedia | null =
      rawLogo && typeof rawLogo === 'object' && rawLogo.url
        ? { url: String(rawLogo.url), alt: String(rawLogo.alt ?? '') }
        : null

    return {
      logo,
      logoMaxWidth: s?.logoMaxWidth ?? 120,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navLinks: (s?.navLinks ?? []).map((item: any) => ({
        label: item.label ?? '',
        url: toUrl(item),
      })),
      contactHeading: s?.contactHeading || 'CONTACT US',
      location: s?.location || '',
      phone: s?.phone || '',
      email: s?.email || '',
      socialHeading: s?.socialHeading || 'CONNECT WITH US',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socialLinks: (s?.socialLinks ?? []).map((item: any) => ({
        label: item.label ?? '',
        url: item.url ?? '#',
        icon: item.icon ?? 'link',
      })),
      copyrightText: s?.copyrightText || `© ${new Date().getFullYear()} Neighbourhood Art Studios`,
      creditText: s?.creditText || 'Designed by GoodTactic Media Co | Web Design | All rights reserved',
    }
  } catch {
    return null
  }
})
