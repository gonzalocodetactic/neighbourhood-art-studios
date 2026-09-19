'use server'

import configPromise from '@payload-config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

export async function serverFunction({
  name,
  args,
}: {
  name: string
  args: Record<string, unknown>
}) {
  return handleServerFunctions({ name, args, config: configPromise, importMap })
}
