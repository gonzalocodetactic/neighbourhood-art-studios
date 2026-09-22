'use client'

import { useState, useTransition } from 'react'

type Props = {
  cities: Array<{ id: number | string; title: string }>
  schools: Array<{ id: number | string; title: string; cityId: string }>
  seasons: Array<{ id: number | string; title: string }>
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--theme-elevation-600)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.375rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--theme-border-color)',
  borderRadius: '4px',
  background: 'var(--theme-elevation-0)',
  color: 'var(--theme-text)',
  fontSize: '0.875rem',
}

export default function BulkVariationEditorClient({ cities, schools, seasons }: Props) {
  const [cityId, setCityId] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const citySchools = schools.filter((s) => s.cityId === cityId)

  function handleApply() {
    setMessage(null)
    const changes: { price?: number; capacity?: number } = {}
    if (price.trim()) {
      const p = parseFloat(price)
      if (isNaN(p) || p < 0) { setMessage({ type: 'error', text: 'Invalid price.' }); return }
      changes.price = p
    }
    if (capacity.trim()) {
      const c = parseInt(capacity, 10)
      if (isNaN(c) || c < 1) { setMessage({ type: 'error', text: 'Invalid capacity.' }); return }
      changes.capacity = c
    }
    if (!changes.price && !changes.capacity) {
      setMessage({ type: 'error', text: 'Enter a price or capacity to apply.' })
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: cityId || undefined,
          schoolId: schoolId || undefined,
          seasonId: seasonId || undefined,
          changes,
        }),
      })
      const data = await res.json()
      if (data.updated !== undefined) {
        setMessage({ type: 'success', text: `Updated ${data.updated} variation${data.updated !== 1 ? 's' : ''}.` })
        setPrice('')
        setCapacity('')
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Unknown error' })
      }
    })
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '680px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--theme-border-color)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '0.5rem' }}>
          Bulk Variation Editor
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)', lineHeight: 1.5 }}>
          Filter by city, school, and/or season, then apply a new price or capacity to all matching
          variations across all products. Leave all filters blank to update every variation.
        </p>
      </div>

      {/* Controls card */}
      <div style={{ border: '1px solid var(--theme-border-color)', borderRadius: '4px', padding: '1.5rem' }}>

        {/* Filter row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={labelStyle}>City</label>
            <select
              value={cityId}
              onChange={(e) => { setCityId(e.target.value); setSchoolId('') }}
              style={inputStyle}
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>School</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              disabled={!cityId}
              style={{ ...inputStyle, opacity: cityId ? 1 : 0.5 }}
            >
              <option value="">All schools{cityId ? ' in city' : ''}</option>
              {citySchools.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>{s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Season</label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              style={inputStyle}
            >
              <option value="">All seasons</option>
              {seasons.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price / Capacity row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={labelStyle}>New Price ($ CAD, optional)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 180.00"
              min={0}
              step={0.01}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>New Capacity (optional)</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 20"
              min={1}
              style={inputStyle}
            />
          </div>
        </div>

        {message && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            background: message.type === 'success' ? 'var(--color-success-100)' : 'var(--color-error-100)',
            color: message.type === 'success' ? 'var(--color-success-700)' : 'var(--color-error-700)',
            border: `1px solid ${message.type === 'success' ? 'var(--color-success-300)' : 'var(--color-error-300)'}`,
          }}>
            {message.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleApply}
          disabled={isPending}
          className="btn btn--style-primary btn--size-medium"
        >
          {isPending ? 'Applying…' : 'Apply Changes'}
        </button>
      </div>
    </div>
  )
}
