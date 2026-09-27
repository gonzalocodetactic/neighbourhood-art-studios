/**
 * One-off: copy existing uploads from public/media/ into Vercel Blob — no Payload dependency.
 *
 * Usage:  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_… npx tsx src/scripts/upload-media-to-blob.ts
 *
 * The Vercel Blob storage adapter looks files up by bare filename (no prefix), so
 * each file is stored under its own name. Safe to re-run: existing blobs are overwritten.
 */

import fs from 'fs'
import path from 'path'
import { put } from '@vercel/blob'

const PUBLIC_MEDIA = path.resolve(process.cwd(), 'public/media')

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('Set BLOB_READ_WRITE_TOKEN (Vercel → Storage → your Blob store)')

  const files = fs.readdirSync(PUBLIC_MEDIA).filter((f) => !f.startsWith('.'))
  let uploaded = 0
  for (const name of files) {
    const body = fs.readFileSync(path.join(PUBLIC_MEDIA, name))
    await put(name, body, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: CONTENT_TYPES[path.extname(name).toLowerCase()],
      token,
    })
    uploaded++
    console.log(`uploaded ${name}`)
  }
  console.log(`Done: ${uploaded} of ${files.length} files`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
