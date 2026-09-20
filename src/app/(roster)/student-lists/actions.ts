'use server'

import { cookies } from 'next/headers'

export async function loginToRoster(
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const expected = process.env.ROSTER_PASSWORD ?? 'art-studios'
  if (password !== expected) {
    return { success: false, error: 'Incorrect password.' }
  }
  const store = await cookies()
  store.set('roster_auth', expected, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return { success: true }
}

export async function logoutFromRoster(): Promise<void> {
  const store = await cookies()
  store.delete('roster_auth')
}
