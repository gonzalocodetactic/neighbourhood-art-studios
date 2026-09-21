import { cache } from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type ChildNavItem = { label: string; url: string }
export type NavItem = { label: string; url: string; icon?: string; children?: ChildNavItem[] }

export type HeaderNav = {
  mainMenuItems: NavItem[]
  sidebarMenuItems: NavItem[]
}

export const getHeaderSettings = cache(async (): Promise<HeaderNav | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (await payload.findGlobal({ slug: 'header-settings', depth: 1 })) as any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toUrl = (item: any): string =>
      item.url ||
      (item.page && typeof item.page === 'object' ? `/${item.page.slug}` : '') ||
      '#'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mainMenuItems: NavItem[] = (settings?.mainMenuItems ?? []).map((item: any) => ({
      label: item.label ?? '',
      url: toUrl(item),
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sidebarMenuItems: NavItem[] = (settings?.sidebarMenuItems ?? []).map((item: any) => ({
      label: item.label ?? '',
      url: toUrl(item),
      icon: item.icon || undefined,
      children: Array.isArray(item.children) && item.children.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? item.children.map((c: any) => ({ label: c.label ?? '', url: toUrl(c) }))
        : undefined,
    }))

    return { mainMenuItems, sidebarMenuItems }
  } catch {
    return null
  }
})
