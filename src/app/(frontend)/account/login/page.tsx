'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/parents/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (res.ok) {
        router.push('/account')
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message ?? 'Invalid email or password.')
      }
    })
  }

  function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotMessage('')
    startTransition(async () => {
      await fetch('/api/parents/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setForgotMessage('If that email exists, a reset link has been sent.')
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-[#3B4BC8] mb-1">Parent Portal</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to view your registrations.</p>

        {!showForgot ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#3B4BC8] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#2d3aaa] transition disabled:opacity-50"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <button type="button" onClick={() => setShowForgot(true)} className="text-[#3B4BC8] underline">
                Forgot password?
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-gray-600">{"Enter your email and we'll send a reset link."}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
              />
            </div>
            {forgotMessage && <p className="text-sm text-green-600">{forgotMessage}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#3B4BC8] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#2d3aaa] transition disabled:opacity-50"
            >
              {isPending ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm">
              <button type="button" onClick={() => setShowForgot(false)} className="text-[#3B4BC8] underline text-sm">
                Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
