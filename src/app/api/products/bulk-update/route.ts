import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { currentUserCan } from '@/access/server'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  if (!(await currentUserCan(payload, 'products', 'update'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    cityId?: string
    schoolId?: string
    seasonId?: string
    changes: { price?: number; capacity?: number }
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { cityId, schoolId, seasonId, changes } = body
  if (!changes || (!changes.price && !changes.capacity)) {
    return NextResponse.json(
      { error: 'At least one of price or capacity must be specified' },
      { status: 400 },
    )
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsRes = (await payload.find({ collection: 'products', limit: 500, depth: 0 })) as any

    let totalUpdated = 0

    for (const product of productsRes.docs) {
      const variations: any[] = product.variations ?? []
      let changed = false

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = variations.map((v: any) => {
        const vCityId   = String(v.city?.id   ?? v.city   ?? '')
        const vSchoolId = String(v.school?.id ?? v.school ?? '')
        const vSeasonId = String(v.season?.id ?? v.season ?? '')

        if (cityId   && vCityId   !== cityId)   return v
        if (schoolId && vSchoolId !== schoolId) return v
        if (seasonId && vSeasonId !== seasonId) return v

        changed = true
        totalUpdated++
        return {
          ...v,
          ...(changes.price    !== undefined ? { price: changes.price }       : {}),
          ...(changes.capacity !== undefined ? { capacity: changes.capacity } : {}),
        }
      })

      if (changed) {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { variations: updated } as any,
        })
      }
    }

    return NextResponse.json({ updated: totalUpdated })
  } catch (err) {
    console.error('[api/products/bulk-update]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
