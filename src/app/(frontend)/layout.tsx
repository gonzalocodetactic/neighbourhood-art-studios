import type { Metadata } from 'next'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import SiteFooter from '@/components/SiteFooter'
import { getHeaderSettings } from '@/lib/getHeaderSettings'
import type React from 'react'

export const metadata: Metadata = {
  title: 'Neighbourhood Art Studios',
  description: 'After-school art programs for kids across Metro Vancouver.',
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const headerNav = await getHeaderSettings()

  return (
    <html lang="en">
      <body>
        <Sidebar sidebarItems={headerNav?.sidebarMenuItems} logo={headerNav?.logo} />
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
