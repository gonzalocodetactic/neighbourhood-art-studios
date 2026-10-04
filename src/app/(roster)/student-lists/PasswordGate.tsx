'use client'

import { useState, useTransition } from 'react'
import { loginToRoster } from './actions'

export default function PasswordGate() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await loginToRoster(password)
      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error ?? 'Login failed.')
        setPassword('')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Neighbourhood Art Studios
          </p>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Student Lists
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the roster password to view student lists.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8] focus:ring-1 focus:ring-[#3B4BC8]"
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 text-sm font-bold text-white bg-[#3B4BC8] rounded-lg hover:bg-[#2D3AAA] disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Checking…' : 'Unlock Student Lists'}
          </button>
        </form>
      </div>
    </div>
  )
}
