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

// ── Product definitions ───────────────────────────────────────────────────────

// Schools that anchor product variations.  One representative per city so the
// /register selector shows real results across all 6 city groups.
const PRODUCT_SCHOOLS = [
  // Burnaby
  'Cameron',
  'Armstrong',
  'Aubrey',
  // Delta
  'Annieville',
  // Langley
  'Alex Hope Elementary',
  // Richmond
  'Anderson',
  // Surrey
  'Bear Creek',
  // Vancouver
  'Bayview Elementary',
]

// Active season for product variations
const PRODUCT_SEASONS = ['Fall 2026']

// [schoolTitle, seasonTitle] pairs — one per school, all anchored to Fall 2026
const ART_PAIRS: [string, string][] = [
  ['Cameron', 'Fall 2026'],
  ['Armstrong', 'Fall 2026'],
  ['Aubrey', 'Fall 2026'],
  ['Annieville', 'Fall 2026'],
  ['Alex Hope Elementary', 'Fall 2026'],
  ['Anderson', 'Fall 2026'],
  ['Bear Creek', 'Fall 2026'],
  ['Bayview Elementary', 'Fall 2026'],
]

const CHECKOUT_FIELDS = [
  { label: 'Student Full Name', fieldType: 'text',     required: true  },
  { label: 'Grade',             fieldType: 'text',     required: true  },
  { label: 'Medical Notes',     fieldType: 'textarea', required: false },
] as const

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })
  const data: SeedData = JSON.parse(
    readFileSync(resolve(process.cwd(), 'schools.json'), 'utf-8'),
  )

  // ── Cities & Schools ────────────────────────────────────────────────────────

  console.log('\n── Cities & Schools ──')
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

  // ── Seasons ─────────────────────────────────────────────────────────────────

  console.log('\n── Seasons ──')
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

  // ── Products ─────────────────────────────────────────────────────────────────

  console.log('\n── Products ──')

  // Resolve school records (with city populated so we can pass the city ID to
  // each variation — the Products collection requires it).
  const [schoolRes, seasonRes] = await Promise.all([
    payload.find({
      collection: 'schools',
      limit: 200,
      depth: 1,
      where: { title: { in: PRODUCT_SCHOOLS } },
    }),
    payload.find({
      collection: 'seasons',
      limit: 50,
      where: { title: { in: PRODUCT_SEASONS } },
    }),
  ])

  type SchoolRef = { id: number | string; cityId: number | string }
  const schoolMap = new Map<string, SchoolRef>()
  for (const s of schoolRes.docs) {
    const cityId =
      s.city && typeof s.city === 'object' && 'id' in s.city
        ? (s.city as { id: number | string }).id
        : (s.city as number | string)
    schoolMap.set(s.title, { id: s.id, cityId })
  }

  const seasonMap = new Map<string, number | string>()
  for (const s of seasonRes.docs) {
    seasonMap.set(s.title, s.id)
  }

  // Build a typed variation array from school+season title pairs
  function buildVariations(
    pairs: [string, string][],
    price: number,
    capacity: number,
  ) {
    return pairs.flatMap(([schoolTitle, seasonTitle]) => {
      const school = schoolMap.get(schoolTitle)
      const seasonId = seasonMap.get(seasonTitle)
      if (!school || !seasonId) {
        console.log(`    [warn] skipping ${schoolTitle} / ${seasonTitle} — not found in DB`)
        return []
      }
      return [{ city: school.cityId, school: school.id, season: seasonId, price, capacity }]
    })
  }

  // Remove legacy products replaced by the master offering
  const LEGACY_TITLES = ['After-School Drawing & Painting', 'Clay & Sculpting Workshop']
  for (const legacyTitle of LEGACY_TITLES) {
    const found = await payload.find({
      collection: 'products',
      where: { title: { equals: legacyTitle } },
      limit: 1,
    })
    if (found.docs.length > 0) {
      await payload.delete({ collection: 'products', id: found.docs[0].id })
      console.log(`  product [del]  ${legacyTitle}`)
    }
  }

  const productDefs = [
    {
      title: 'Art Classes At Your School',
      price: 180.00, // $180.00 CAD
      capacity: 20,
      pairs: ART_PAIRS,
    },
  ]

  for (const def of productDefs) {
    const existing = await payload.find({
      collection: 'products',
      where: { title: { equals: def.title } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  product [skip] ${def.title}`)
      continue
    }

    const variations = buildVariations(def.pairs, def.price, def.capacity)

    await payload.create({
      collection: 'products',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        title: def.title,
        variations,
        checkoutFields: [...CHECKOUT_FIELDS],
      } as any,
    })

    console.log(`  product [+]    ${def.title}`)
    console.log(`    ${variations.length} variations · $${def.price.toFixed(2)} CAD · capacity ${def.capacity}`)
  }

  console.log('\nSeed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
