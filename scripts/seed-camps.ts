/**
 * Idempotent seed: ensures the camp / session products exist and that each has
 * one variation per Location × Timeslot × Camp Week (price $225 CAD, capacity 20).
 * Existing variations keep their registeredCount, status, price and capacity.
 *
 * Usage: DATABASE_URI=file:./payload.db npx tsx scripts/seed-camps.ts
 */
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const PRODUCTS = [
  { title: 'Summer Art Camps 2026', legacyTitles: ['Summer Art Camp 2026', 'Summer Art Camp 2025'] },
  { title: 'Spring Art Sessions 2026', legacyTitles: [] as string[] },
]

async function main() {
  const payload = await getPayload({ config: configPromise })

  const [locations, timeslots, weeks] = await Promise.all([
    payload.find({ collection: 'locations', limit: 500, depth: 0 }),
    payload.find({ collection: 'timeslots', limit: 500, depth: 0 }),
    payload.find({ collection: 'camp-weeks', limit: 500, depth: 0 }),
  ])
  console.log(`Matrix: ${locations.docs.length} locations × ${timeslots.docs.length} timeslots × ${weeks.docs.length} weeks`)

  for (const def of PRODUCTS) {
    const found = await payload.find({
      collection: 'products',
      limit: 1,
      depth: 0,
      where: { title: { in: [def.title, ...def.legacyTitles] } },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let product: any = found.docs[0]
    if (!product) {
      product = await payload.create({
        collection: 'products',
        data: { title: def.title, productType: 'camp', variations: [] } as any,
      })
      console.log(`Created product "${def.title}" (${product.id})`)
    } else if (product.title !== def.title) {
      product = await payload.update({ collection: 'products', id: product.id, data: { title: def.title } as any })
      console.log(`Renamed product ${product.id} → "${def.title}"`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variations: any[] = (product.variations ?? []).filter((v: any) => v.location && v.timeslot && v.campWeek)
    const keyOf = (l: unknown, t: unknown, w: unknown) => `${l}-${t}-${w}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = new Set(variations.map((v: any) => keyOf(v.location, v.timeslot, v.campWeek)))

    let added = 0
    for (const l of locations.docs) for (const t of timeslots.docs) for (const w of weeks.docs) {
      if (existing.has(keyOf(l.id, t.id, w.id))) continue
      variations.push({ location: l.id, timeslot: t.id, campWeek: w.id, price: 225, capacity: 20, registeredCount: 0, status: 'open' })
      added++
    }

    await payload.update({ collection: 'products', id: product.id, data: { variations } as any })
    console.log(`"${def.title}": +${added} variations (${variations.length} total)`)
  }

  console.log('Done!')
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
