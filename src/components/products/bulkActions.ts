'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { currentUserCan } from '@/access/server'

export type GenerateResult =
  | { success: true; created: number; skipped: number }
  | { success: false; error: string }

export type BulkUpdateResult =
  | { success: true; updated: number }
  | { success: false; error: string }

export async function generateVariations(
  productId: number | string,
  cityId: number | string,
  schoolIds: string[],
  price: number,
  capacity: number,
  seasonId: number | string,
): Promise<GenerateResult> {
  try {
    const payload = await getPayload({ config: configPromise })
    if (!(await currentUserCan(payload, 'products', 'update'))) return { success: false, error: 'Not allowed' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await payload.findByID({ collection: 'products', id: productId, depth: 1 }) as any
    if (!product) return { success: false, error: 'Product not found' }

    const existing = new Set<string>()
    for (const v of product.variations ?? []) {
      const sid = String(v.school?.id ?? v.school ?? '')
      const ssid = String(v.season?.id ?? v.season ?? '')
      existing.add(`${sid}-${ssid}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newVariations: any[] = [...(product.variations ?? [])]
    let created = 0
    let skipped = 0

    for (const schoolId of schoolIds) {
      const key = `${schoolId}-${String(seasonId)}`
      if (existing.has(key)) {
        skipped++
      } else {
        newVariations.push({ city: cityId, school: schoolId, season: seasonId, price, capacity })
        created++
      }
    }

    await payload.update({
      collection: 'products',
      id: productId,
      data: { variations: newVariations } as any,
    })

    return { success: true, created, skipped }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function bulkUpdateVariations(
  productId: number | string,
  variationIds: string[],
  changes: { price?: number; capacity?: number },
): Promise<BulkUpdateResult> {
  try {
    const payload = await getPayload({ config: configPromise })
    if (!(await currentUserCan(payload, 'products', 'update'))) return { success: false, error: 'Not allowed' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await payload.findByID({ collection: 'products', id: productId, depth: 0 }) as any
    if (!product) return { success: false, error: 'Product not found' }

    const idSet = new Set(variationIds)
    let updated = 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedVariations = (product.variations ?? []).map((v: any) => {
      if (idSet.has(String(v.id))) {
        updated++
        return { ...v, ...(changes.price !== undefined ? { price: changes.price } : {}), ...(changes.capacity !== undefined ? { capacity: changes.capacity } : {}) }
      }
      return v
    })

    await payload.update({
      collection: 'products',
      id: productId,
      data: { variations: updatedVariations } as any,
    })

    return { success: true, updated }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
