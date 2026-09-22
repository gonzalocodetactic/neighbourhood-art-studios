'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { NasLogo } from './NasLogo'
import type { LogoMedia, NavItem } from '@/lib/getHeaderSettings'
import { getMediaUrl } from '@/utilities/getMediaUrl'

const FALLBACK_NAV: NavItem[] = [
  { label: 'Home', url: '/' },
  {
    label: 'Programs',
    url: '/programs',
    children: [
      { label: 'Instructors', url: '/instructors' },
      { label: 'Camps', url: '/camps' },
      { label: 'Art Parties', url: '/art-parties' },
    ],
  },
  { label: 'Become a Teacher', url: '/become-a-teacher' },
  { label: 'In Class Workshops', url: '/in-class-workshops' },
  { label: 'Gallery', url: '/gallery' },
  { label: 'Contact', url: '/contact' },
  { label: 'Register', url: '/register' },
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

export default function Sidebar({
  sidebarItems,
  logo,
  logoMaxWidth = 84,
}: {
  sidebarItems?: NavItem[]
  logo?: LogoMedia | null
  logoMaxWidth?: number
}) {
  const pathname = usePathname()
  const items = sidebarItems && sidebarItems.length > 0 ? sidebarItems : FALLBACK_NAV

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const hasActiveChild = (item: NavItem) =>
    item.children?.some((c) => isActive(c.url)) ?? false

  // Pre-open any parent whose child is active
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(items.filter(hasActiveChild).map((i) => i.url)),
  )

  function toggleItem(url: string) {
    setOpenItems((prev) => {
      const next = new Set(prev)
      next.has(url) ? next.delete(url) : next.add(url)
      return next
    })
  }

  return (
    <aside
      style={{ width: 'var(--sidebar-width)' }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 overflow-y-auto"
    >
      {/* Logo */}
      <div className="flex justify-center pt-5 pb-3 px-4 border-b border-gray-100">
        <Link href="/" aria-label="Neighbourhood Art Studios Home">
          {logo ? (
            <Image
              src={getMediaUrl(logo)}
              alt={logo.alt || 'Neighbourhood Art Studios'}
              width={logoMaxWidth}
              height={logoMaxWidth}
              style={{ maxWidth: logoMaxWidth, height: 'auto' }}
              className="object-contain"
              unoptimized
            />
          ) : (
            <NasLogo size={logoMaxWidth} />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const open = openItems.has(item.url)
            const parentActive = isActive(item.url) || hasActiveChild(item)

            return (
              <li key={item.url}>
                {hasChildren ? (
                  <>
                    {/* Row: link + chevron toggle */}
                    <div className="flex items-center">
                      <Link
                        href={item.url}
                        className={`flex-1 flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium tracking-wide rounded-l transition-colors ${
                          parentActive
                            ? 'text-[#3B4BC8] font-semibold'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {item.icon && <span>{item.icon}</span>}
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.url)}
                        aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        className={`px-1.5 py-1.5 rounded-r transition-colors ${
                          parentActive ? 'text-[#3B4BC8]' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <ChevronIcon open={open} />
                      </button>
                    </div>

                    {/* Children */}
                    {open && (
                      <ul className="ml-3 mt-0.5 space-y-0.5">
                        {item.children!.map((child) => (
                          <li key={child.url}>
                            <Link
                              href={child.url}
                              className={`block px-3 py-1 text-[11px] tracking-wide rounded transition-colors ${
                                isActive(child.url)
                                  ? 'text-[#3B4BC8] font-semibold'
                                  : 'text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.url}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium tracking-wide rounded transition-colors ${
                      isActive(item.url)
                        ? 'text-[#3B4BC8] font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Social icons */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 text-gray-500">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-gray-800 transition-colors">
            <TwitterIcon />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gray-800 transition-colors">
            <FacebookIcon />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gray-800 transition-colors">
            <InstagramIcon />
          </a>
        </div>
      </div>
    </aside>
  )
}
