import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'

export async function POST(request: NextRequest) {
  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both passwords required.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = await (payload as any).auth({ headers: await getHeaders(), collection: 'parents' })
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  // Verify current password by re-attempting login
  const loginResult = await payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .login({ collection: 'parents', data: { email: (user as any).email, password: currentPassword } })
    .catch(() => null)
  if (!loginResult) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })

  await payload.update({
    collection: 'parents',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: (user as any).id,
    data: { password: newPassword } as any,
  })

  return NextResponse.json({ ok: true })
}
