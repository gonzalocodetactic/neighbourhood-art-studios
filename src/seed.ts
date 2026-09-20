import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config'

// (@next/env interop + .env.local loading are handled by src/seed-preload.cjs
//  via --require, which runs before tsx registers and before these imports
//  resolve — so PAYLOAD_SECRET / DATABASE_URI are set when payload.config.ts
//  is first evaluated.)

interface CityEntry {
  name: string
  slug: string
  schools: string[]
}

interface SeedData {
  cities: CityEntry[]
  seasons: string[]
}

async function main() {
  const payload = await getPayload({ config })
  const data: SeedData = JSON.parse(
    readFileSync(resolve(process.cwd(), 'schools.json'), 'utf-8'),
  )

  // ── Cities & Schools ────────────────────────────────────────────────────

  for (const cityEntry of data.cities) {
    const existing = await payload.find({
      collection: 'cities',
      where: { slug: { equals: cityEntry.slug } },
      limit: 1,
    })

    let cityId: number | string
    if (existing.docs.length > 0) {
      cityId = existing.docs[0].id
      console.log(`  city  [skip] ${cityEntry.name}`)
    } else {
      const created = await payload.create({
        collection: 'cities',
        data: { title: cityEntry.name, slug: cityEntry.slug },
      })
      cityId = created.id
      console.log(`  city  [+]    ${cityEntry.name}`)
    }

    for (const schoolName of cityEntry.schools) {
      const existingSchool = await payload.find({
        collection: 'schools',
        where: {
          and: [
            { title: { equals: schoolName } },
            { city: { equals: cityId } },
          ],
        },
        limit: 1,
      })

      if (existingSchool.docs.length > 0) continue

      await payload.create({
        collection: 'schools',
        data: { title: schoolName, city: cityId, active: true },
      })
      console.log(`    school [+] ${schoolName}`)
    }
  }

  // ── Seasons ──────────────────────────────────────────────────────────────

  for (const title of data.seasons) {
    const existing = await payload.find({
      collection: 'seasons',
      where: { title: { equals: title } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  season [skip] ${title}`)
      continue
    }

    await payload.create({
      collection: 'seasons',
      data: { title, active: true },
    })
    console.log(`  season [+]    ${title}`)
  }

  console.log('\nSeed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
