'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function StudentListsNavLink() {
  const pathname = usePathname()
  const active = pathname?.startsWith('/admin/student-roster') ?? false

  return (
    <div style={{ padding: '0 16px', marginTop: 4 }}>
      <Link
        href="/admin/student-roster"
        style={{
          display: 'block',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: active ? 600 : 400,
          color: active ? 'var(--theme-text)' : 'var(--theme-elevation-700)',
          background: active ? 'var(--theme-elevation-100)' : 'transparent',
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
      >
        Student Lists
      </Link>
    </div>
  )
}
