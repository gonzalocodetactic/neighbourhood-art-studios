'use client'

import { useState, useTransition } from 'react'

export function SendPasswordResetButtonClient({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleClick() {
    setMessage(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/parents/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (res.ok) {
          setMessage({ type: 'success', text: `Reset link sent to ${email}` })
        } else {
          setMessage({ type: 'error', text: 'Failed to send reset email.' })
        }
      } catch {
        setMessage({ type: 'error', text: 'Network error.' })
      }
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn btn--style-secondary btn--size-medium"
      >
        {isPending ? 'Sending…' : 'Send Password Reset'}
      </button>
      {message && (
        <span style={{
          fontSize: '0.8125rem',
          color: message.type === 'success' ? 'var(--color-success-700)' : 'var(--color-error-700)',
        }}>
          {message.text}
        </span>
      )}
    </div>
  )
}
