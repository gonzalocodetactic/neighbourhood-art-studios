import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // formId and data are available here for future persistence / email sending
    const { formId, data } = body as { formId: unknown; data: Record<string, string> }
    if (!formId || !data) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }
    // TODO: wire up email delivery or store submission
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}
