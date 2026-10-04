'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type React from 'react'
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

function NavContent({
  items,
  logo,
  logoMaxWidth,
  touch = false,
}: {
  items: NavItem[]
  logo?: LogoMedia | null
  logoMaxWidth: number
  /** Drawer variant: larger rows so every link is a comfortable tap target */
  touch?: boolean
}) {
  const pathname = usePathname()

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
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const row = touch ? 'min-h-11 px-3 py-2.5 text-[15px]' : 'px-3 py-1.5 text-[11.5px]'
  const childRow = touch ? 'min-h-11 flex items-center px-3 py-2.5 text-[14px]' : 'block px-3 py-1 text-[11px]'

  return (
    <>
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
                    {/* Parent is an accordion label, not a link — only its children navigate */}
                    <button
                      type="button"
                      onClick={() => toggleItem(item.url)}
                      aria-expanded={open}
                      className={`w-full flex items-center gap-1.5 ${row} font-medium tracking-wide rounded transition-colors ${
                        parentActive
                          ? 'text-[#3B4BC8] font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      <span className="flex-1 text-left">{item.label}</span>
                      <span className={`px-1.5 ${parentActive ? 'text-[#3B4BC8]' : 'text-gray-400'}`}>
                        <ChevronIcon open={open} />
                      </span>
                    </button>

                    {/* Children */}
                    {open && (
                      <ul className="ml-3 mt-0.5 space-y-0.5">
                        {item.children!.map((child) => (
                          <li key={child.url}>
                            <Link
                              href={child.url}
                              className={`${childRow} tracking-wide rounded transition-colors ${
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
                    className={`flex items-center gap-1.5 ${row} font-medium tracking-wide rounded transition-colors ${
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
        <div className={`flex items-center text-gray-500 ${touch ? 'gap-1' : 'gap-3'}`}>
          {[
            { href: 'https://twitter.com', label: 'Twitter', icon: <TwitterIcon /> },
            { href: 'https://facebook.com', label: 'Facebook', icon: <FacebookIcon /> },
            { href: 'https://instagram.com', label: 'Instagram', icon: <InstagramIcon /> },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className={`hover:text-gray-800 transition-colors ${touch ? 'w-11 h-11 flex items-center justify-center' : ''}`}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-6 h-6" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-6 h-6" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const [dragX, setDragX] = useState(0)

  // Close the drawer whenever the route changes (a link inside it was tapped)
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setDrawerOpen(false)
  }

  // While open: lock page scroll, close on Escape, move focus into the drawer
  useEffect(() => {
    if (!drawerOpen) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', onKey)
    const menuButton = menuRef.current
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      menuButton?.focus()
    }
  }, [drawerOpen])

  // Swipe left to close: the drawer follows the finger, then closes past 80px
  function onTouchStart(e: React.TouchEvent) {
    swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!swipe.current) return
    const dx = e.touches[0].clientX - swipe.current.x
    const dy = e.touches[0].clientY - swipe.current.y
    if (Math.abs(dx) > Math.abs(dy)) setDragX(Math.min(0, dx))
  }
  function onTouchEnd() {
    if (dragX < -80) setDrawerOpen(false)
    setDragX(0)
    swipe.current = null
  }

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside
        style={{ width: 'var(--sidebar-width)' }}
        className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-white border-r border-gray-200 overflow-y-auto"
      >
        <NavContent items={items} logo={logo} logoMaxWidth={logoMaxWidth} />
      </aside>

      {/* Mobile: top bar with menu button */}
      <header
        style={{ height: 'var(--mobile-header-height)' }}
        className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-2"
      >
        <Link href="/" aria-label="Neighbourhood Art Studios Home" className="flex items-center gap-2 px-2 min-h-11">
          {logo ? (
            <Image src={getMediaUrl(logo)} alt={logo.alt || 'Neighbourhood Art Studios'} width={40} height={40} className="object-contain" unoptimized />
          ) : (
            <NasLogo size={40} />
          )}
          <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            Neighbourhood Art Studios
          </span>
        </Link>
        <button
          ref={menuRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Mobile: slide-out drawer */}
      <div className={`md:hidden fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          inert={!drawerOpen}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={dragX ? { transform: `translateX(${dragX}px)`, transition: 'none' } : undefined}
          className={`absolute inset-y-0 left-0 flex flex-col w-[min(85vw,320px)] bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="absolute top-2 right-2 z-10 w-11 h-11 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <CloseIcon />
          </button>
          <NavContent items={items} logo={logo} logoMaxWidth={logoMaxWidth} touch />
        </aside>
      </div>
    </>
  )
}
