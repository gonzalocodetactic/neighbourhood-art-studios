import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'registrations',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { monerisOrderId: { equals: orderId } } as any,
      depth: 2,
      limit: 1,
    })

    const reg = result.docs[0]
    if (!reg) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = reg as any
    const productTitle = r.product?.title ?? r.product ?? 'N/A'

    const students: { firstName: string; lastName?: string }[] = Array.isArray(r.students)
      ? r.students
      : []

    // Fetch gstLabel from payment settings for display in receipt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const psettings = (await payload.findGlobal({ slug: 'payment-settings' })) as any
    const gstLabel: string = psettings?.gstLabel || 'GST (BC 5%)'

    return NextResponse.json({
      orderId: r.monerisOrderId ?? orderId,
      createdAt: r.createdAt,
      parentFirstName: r.parentFirstName,
      parentLastName: r.parentLastName,
      parentEmail: r.parentEmail,
      students,
      product: productTitle,
      classDate: r.classDate ?? null,
      paymentStatus: r.paymentStatus,
      subtotal: r.subtotal ?? null,
      gstAmount: r.gstAmount ?? null,
      gstLabel,
      totalAmount: r.totalAmount ?? null,
    })
  } catch (err) {
    console.error('[api/order]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
