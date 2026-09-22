/**
 * Standalone media seed script — no Payload dependency.
 *
 * Usage:  npx tsx src/scripts/seed-media.ts
 *
 * What it does:
 *   1. Ensures public/media/ exists.
 *   2. Downloads any missing seed images into public/media/.
 *   3. Ensures public/placeholder.jpg exists (copies first available seed image).
 */

import fs from 'fs'
import path from 'path'

const PUBLIC_MEDIA = path.resolve(process.cwd(), 'public/media')
const PLACEHOLDER = path.resolve(process.cwd(), 'public/placeholder.jpg')

// Known seed images: camps hero, art gallery photos, teacher/content images
const SEED_IMAGES: Array<{ name: string; url: string }> = [
  { name: '1.jpg',  url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/1.jpg' },
  { name: '5.jpg',  url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/5.jpg' },
  { name: '6.jpg',  url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/6.jpg' },
  { name: '10.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2017/03/10.jpg' },
  { name: '33.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/33.jpg' },
  { name: '35.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/35.jpg' },
  { name: '36.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/36.jpg' },
  { name: '37.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/37.jpg' },
  { name: '39.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/39.jpg' },
  { name: '41.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/41.jpg' },
  { name: '45.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/45.jpg' },
  { name: '50.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/50.jpg' },
  { name: '51.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/51.jpg' },
  { name: '52.jpg', url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2021/01/52.jpg' },
  {
    name: 'header_camps.webp',
    url: 'https://neighbourhoodartstudios.com/wp-content/uploads/2022/07/header_camps.webp',
  },
]

async function downloadFile(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url)
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(dest, buf)
    return true
  } catch {
    return false
  }
}

async function main() {
  // 1. Ensure public/media/ exists
  if (!fs.existsSync(PUBLIC_MEDIA)) {
    fs.mkdirSync(PUBLIC_MEDIA, { recursive: true })
    console.log('Created public/media/')
  }

  // 2. Download missing seed images
  let firstAvailable: string | null = null
  for (const img of SEED_IMAGES) {
    const dest = path.join(PUBLIC_MEDIA, img.name)
    if (fs.existsSync(dest)) {
      if (!firstAvailable) firstAvailable = dest
      continue
    }
    const ok = await downloadFile(img.url, dest)
    if (ok) {
      console.log(`  [+] ${img.name}`)
      if (!firstAvailable) firstAvailable = dest
    } else {
      console.warn(`  [skip] ${img.name} — download failed`)
    }
  }

  // 3. Ensure public/placeholder.jpg exists
  if (!fs.existsSync(PLACEHOLDER)) {
    if (firstAvailable) {
      fs.copyFileSync(firstAvailable, PLACEHOLDER)
      console.log(`Created placeholder.jpg from ${path.basename(firstAvailable)}`)
    } else {
      console.warn('No source image available for placeholder.jpg — skipped')
    }
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
