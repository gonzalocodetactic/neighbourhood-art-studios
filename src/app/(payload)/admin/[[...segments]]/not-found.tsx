import { NotFoundPage } from '@payloadcms/next/views'
import configPromise from '@payload-config'
import { importMap } from '../importMap.js'

export default async function NotFound() {
  return (
    <NotFoundPage
      config={configPromise}
      importMap={importMap}
      params={Promise.resolve({ segments: [] })}
      searchParams={Promise.resolve({})}
    />
  )
}
