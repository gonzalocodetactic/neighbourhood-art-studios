/**
 * Verifies camp registration reads/updates capacity on the product's `variations`.
 *
 * Usage: DATABASE_URI=file:./payload.db node --require ./src/seed-preload.cjs --require tsx/cjs scripts/test-camp-capacity.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { submitCampRegistration } from '../src/app/(frontend)/register/actions'

function assert(cond: unknown, msg: string) {
  if (!cond) { console.error(`❌ ${msg}`); process.exit(1) }
  console.log(`✓ ${msg}`)
}

async function main() {
  const payload = await getPayload({ config })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product: any = (await payload.find({ collection: 'products', where: { title: { equals: 'Spring Art Sessions 2026' } }, limit: 1, depth: 0 })).docs[0]
  assert(product?.variations?.length === 18, 'Spring Art Sessions 2026 has 18 variations')
  const varId = product.variations[0].id
  const setCount = (n: number, cap: number) => payload.update({
    collection: 'products', id: product.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { variations: product.variations.map((v: any) => v.id === varId ? { ...v, registeredCount: n, capacity: cap } : v) } as any,
  })
  const read = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = await payload.findByID({ collection: 'products', id: product.id, depth: 0 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return p.variations.find((v: any) => v.id === varId)
  }
  const base = {
    parentFirstName: 'Cap', parentLastName: 'Test', parentEmail: `cap-${Date.now()}@example.com`, parentPhone: '604-555-0100',
    students: [{ firstName: 'Kid', gender: 'Male' }], productId: product.id, campSessionId: varId, checkoutAnswers: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  const created: (number | string)[] = []
  try {
    await setCount(0, 1)
    const ok = await submitCampRegistration(base)
    assert(ok.success, 'registration succeeds when a spot is free')
    if (ok.success) created.push(ok.id)
    assert((await read()).registeredCount === 1, 'registeredCount incremented to 1 on the variation')

    const full = await submitCampRegistration(base)
    assert(!full.success && /full/i.test((full as { error: string }).error), 'registration rejected when variation is at capacity')
    assert((await read()).registeredCount === 1, 'registeredCount unchanged after rejection')
  } finally {
    for (const id of created) await payload.delete({ collection: 'registrations', id }).catch(() => {})
    await setCount(0, 20)
  }
  console.log('✅ Camp capacity checks passed')
  process.exit(0)
}
main().catch((e) => { console.error('❌', e); process.exit(1) })
