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
        <Sidebar
          sidebarItems={headerNav?.sidebarMenuItems}
          logo={headerNav?.logo}
          logoMaxWidth={headerNav?.logoMaxWidth}
        />
        {/* Mobile: clear the fixed top bar. Desktop: clear the fixed sidebar. */}
        <div className="flex min-h-screen flex-col pt-[var(--mobile-header-height)] md:pt-0 md:ml-[var(--sidebar-width)]">
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
