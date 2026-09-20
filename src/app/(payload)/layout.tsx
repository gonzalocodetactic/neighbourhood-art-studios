import configPromise from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import '@payloadcms/next/css'
import type React from 'react'
import { importMap } from './admin/importMap.js'
import { serverFunction } from './actions'
import './custom.css'

type Args = { children: React.ReactNode }

export default function Layout({ children }: Args) {
  return (
    <RootLayout
      config={configPromise}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  )
}
