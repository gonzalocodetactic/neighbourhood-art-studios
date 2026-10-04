'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type View = 'login' | 'signup' | 'forgot'

const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30'
const BTN_PRIMARY = 'w-full min-h-11 bg-[#3B4BC8] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#2d3aaa] transition disabled:opacity-50'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [view, setView] = useState<View>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Sign-up
  const [suFirst, setSuFirst] = useState('')
  const [suLast, setSuLast] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPhone, setSuPhone] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [signupError, setSignupError] = useState('')

  // Forgot
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
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
        setLoginError(data?.errors?.[0]?.message ?? 'Invalid email or password.')
      }
    })
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setSignupError('')
    startTransition(async () => {
      const res = await fetch('/api/parents/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: suFirst, lastName: suLast, email: suEmail, phone: suPhone, password: suPassword }),
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        router.push(data.redirect ?? '/account')
        router.refresh()
      } else {
        setSignupError(data?.error ?? 'Could not create account.')
      }
    })
  }

  function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotMsg('')
    startTransition(async () => {
      await fetch('/api/parents/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setForgotMsg('If that email exists, a reset link has been sent.')
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-[#3B4BC8] mb-5">Parent Portal</h1>

        {view !== 'forgot' && (
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-full p-1">
            {(['login', 'signup'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`flex-1 min-h-11 md:min-h-0 py-1.5 text-sm font-medium rounded-full transition ${view === v ? 'bg-white shadow-sm text-[#3B4BC8]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {v === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
        )}

        {/* ── Sign In ────────────────────────────────────────────────── */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={INPUT} />
            </div>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <button type="button" onClick={() => setView('forgot')} className="inline-block py-3 md:py-0 text-[#3B4BC8] underline">
                Forgot password?
              </button>
            </p>
          </form>
        )}

        {/* ── Create Account ─────────────────────────────────────────── */}
        {view === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" value={suFirst} onChange={(e) => setSuFirst(e.target.value)} required className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" value={suLast} onChange={(e) => setSuLast(e.target.value)} required className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={suPhone} onChange={(e) => setSuPhone(e.target.value)} placeholder="Optional" className={INPUT} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required minLength={8} className={INPUT} />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
            </div>
            {signupError && <p className="text-sm text-red-600">{signupError}</p>}
            <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        {/* ── Forgot Password ────────────────────────────────────────── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-gray-600">{"Enter your email and we'll send a reset link."}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={INPUT} />
            </div>
            {forgotMsg && <p className="text-sm text-green-600">{forgotMsg}</p>}
            <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm">
              <button type="button" onClick={() => setView('login')} className="text-[#3B4BC8] underline text-sm">
                Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
