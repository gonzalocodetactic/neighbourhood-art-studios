import type { Metadata } from 'next'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import SiteFooter from '@/components/SiteFooter'
import type React from 'react'

export const metadata: Metadata = {
  title: 'Neighbourhood Art Studios',
  description: 'After-school art programs for kids across Metro Vancouver.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Fixed left sidebar */}
        <Sidebar />

        {/* Scrollable content area — offset by sidebar width */}
        <div
          style={{ marginLeft: 'var(--sidebar-width)' }}
          className="flex min-h-screen flex-col"
        >
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
