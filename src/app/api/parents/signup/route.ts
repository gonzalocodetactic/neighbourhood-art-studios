import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function POST(request: NextRequest) {
  let body: { firstName?: string; lastName?: string; email?: string; phone?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { firstName, lastName, email, phone, password } = body
  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: 'First name, last name, email and password are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  // Block duplicate email
  const existing = await payload.find({
    collection: 'parents',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
  }

  // Create parent
  await payload.create({
    collection: 'parents',
    data: {
      firstName,
      lastName,
      email,
      phone: phone ?? '',
      password,
      lastLoginAt: new Date().toISOString(),
    } as any,
  })

  // Log them in to get an auth token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loginResult = await (payload as any).login({
    collection: 'parents',
    data: { email, password },
  }).catch(() => null)

  if (!loginResult?.token) {
    // Account created but login failed; client can redirect to login page
    return NextResponse.json({ ok: true, redirect: '/account/login' })
  }

  const response = NextResponse.json({ ok: true, redirect: '/account' })
  response.cookies.set('payload-token', loginResult.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 2, // 2 hours (Payload default)
  })
  return response
}
