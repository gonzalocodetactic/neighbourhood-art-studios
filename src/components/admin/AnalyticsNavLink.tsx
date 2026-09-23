'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AnalyticsNavLink() {
  const pathname = usePathname()
  const active = pathname?.includes('/admin/analytics') ?? false

  return (
    <div style={{ padding: '0 16px', marginTop: 4 }}>
      <Link
        href="/admin/analytics"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Analytics
      </Link>
    </div>
  )
}
