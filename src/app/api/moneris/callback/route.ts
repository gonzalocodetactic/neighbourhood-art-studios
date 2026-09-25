import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

// Moneris approval: response_code 001–049 (numeric 1–49)
function isApproved(code: string): boolean {
  const n = parseInt(code, 10)
  return !Number.isNaN(n) && n >= 1 && n <= 49
}

function flatten(obj: unknown, prefix = ''): Record<string, string> {
  if (!obj || typeof obj !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') Object.assign(out, flatten(v, key))
    else out[key] = String(v ?? '')
  }
  return out
}

export async function POST(request: NextRequest) {
  let flat: Record<string, string> = {}

  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const json = await request.json()
      flat = flatten(json)
    } else {
      const text = await request.text()
      for (const pair of text.split('&')) {
        const eq = pair.indexOf('=')
        if (eq === -1) continue
        const k = decodeURIComponent(pair.slice(0, eq))
        const v = decodeURIComponent(pair.slice(eq + 1))
        flat[k] = v
      }
    }
  } catch {
    // malformed body — fall through to decline redirect
  }

  // Support both nested receipt format and flat format
  const orderNo =
    flat['receipt.cc.order_no'] ??
    flat['order_no'] ??
    flat['response.order_no'] ??
    ''

  const responseCode =
    flat['receipt.cc.response_code'] ??
    flat['response_code'] ??
    flat['receipt.response_code'] ??
    '999'

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL('/', request.url).origin
  const registerUrl = `${base}/register`

  if (!isApproved(responseCode) || !orderNo) {
    // Fire-and-forget admin alert for failed payment
    try {
      const pl = await getPayload({ config: configPromise })
      const { sendFailedOrder } = await import('@/emails/sendFailedOrder')
      sendFailedOrder(pl, { monerisOrderId: orderNo || '(unknown)' }).catch(console.error)
    } catch { /* silent */ }
    return NextResponse.redirect(`${registerUrl}?payment=failed`, { status: 303 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const found = await payload.find({
      collection: 'registrations',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { monerisOrderId: { equals: orderNo } } as any,
      limit: 1,
    })

    if (found.docs.length > 0) {
      await payload.update({
        collection: 'registrations',
        id: found.docs[0].id,
        data: { paymentStatus: 'paid' } as any,
      })

      // Send order confirmation email (fire-and-forget)
      try {
        const fullReg = await payload.findByID({
          collection: 'registrations',
          id: found.docs[0].id,
          depth: 1,
        }) as any
        const { sendOrderConfirmation, toEmailRegistration } = await import('@/emails/sendOrderConfirmation')
        toEmailRegistration(payload, fullReg)
          .then((data) => sendOrderConfirmation(payload, data))
          .catch(console.error)
      } catch { /* silent */ }
    }

    return NextResponse.redirect(`${registerUrl}?payment=success`, { status: 303 })
  } catch (err) {
    console.error('[moneris/callback]', err)
    return NextResponse.redirect(`${registerUrl}?payment=error`, { status: 303 })
  }
}
