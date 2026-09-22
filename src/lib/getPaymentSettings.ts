import { cache } from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type GstSettings = {
  gstEnabled: boolean
  gstRate: number
  gstLabel: string
  gstNumber: string
}

export const getPaymentSettings = cache(async (): Promise<GstSettings> => {
  try {
    const payload = await getPayload({ config: configPromise })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (await payload.findGlobal({ slug: 'payment-settings' })) as any
    return {
      gstEnabled: s?.gstEnabled ?? true,
      gstRate:    typeof s?.gstRate === 'number' ? s.gstRate : 5,
      gstLabel:   s?.gstLabel   || 'GST (BC 5%)',
      gstNumber:  s?.gstNumber  || '',
    }
  } catch {
    return { gstEnabled: true, gstRate: 5, gstLabel: 'GST (BC 5%)', gstNumber: '' }
  }
})
