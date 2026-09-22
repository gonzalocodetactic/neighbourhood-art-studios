/**
 * One-time migration: convert product variation prices from CAD cents → CAD dollars.
 * Run once after deploying the schema change that switched price to standard dollars.
 * Safe to re-run: prices ≤ 1.00 are skipped (already converted or intentionally cheap).
 */
import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  const payload = await getPayload({ config })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await payload.find({ collection: 'products', limit: 500, depth: 0 }) as any
  let totalUpdated = 0

  for (const product of result.docs) {
    const variations = product.variations ?? []
    let changed = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = variations.map((v: any) => {
      const price = Number(v.price ?? 0)
      if (price > 1) {
        // Looks like cents — divide by 100
        changed = true
        return { ...v, price: Math.round(price) / 100 }
      }
      return v
    })

    if (changed) {
      await payload.update({
        collection: 'products',
        id: product.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { variations: updated } as any,
      })
      totalUpdated++
      process.stdout.write('+')
    } else {
      process.stdout.write('.')
    }
  }

  console.log(`\nDone — converted prices on ${totalUpdated} product(s).`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
