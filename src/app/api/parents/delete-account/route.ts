import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'

export async function DELETE(_request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = await (payload as any).auth({ headers: await headers(), collection: 'parents' })

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.delete({ collection: 'parents', id: (user as any).id })
  } catch {
    return NextResponse.json({ error: 'Could not delete account.' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('payload-token', '', { maxAge: 0, path: '/' })
  return response
}
