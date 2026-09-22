'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Drawer, DrawerToggler, useDrawerSlug } from '@payloadcms/ui'
import { bulkUpdateVariations } from '../products/bulkActions'

type Variation = {
  id: string
  cityId: string
  schoolId: string
  seasonId: string
  price: number
  capacity: number
  schoolTitle: string
  seasonTitle: string
}

type Props = {
  productId: string
  cities: Array<{ id: string; title: string }>
  schools: Array<{ id: string; title: string; cityId: string }>
  seasons: Array<{ id: string; title: string }>
  initialVariations: Variation[]
}

function formatPrice(dollars: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(dollars)
}

export default function BulkVariationModalClient({
  productId,
  cities,
  schools,
  seasons,
  initialVariations,
}: Props) {
  const drawerSlug = useDrawerSlug('bulk-variation-editor')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [cityFilter, setCityFilter] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filteredSchools = schools.filter((s) => s.cityId === cityFilter)

  const filteredVariations = initialVariations.filter((v) => {
    if (cityFilter && v.cityId !== cityFilter) return false
    if (schoolFilter && v.schoolId !== schoolFilter) return false
    if (seasonFilter && v.seasonId !== seasonFilter) return false
    return true
  })

  function toggleAll() {
    if (selectedIds.size === filteredVariations.length && filteredVariations.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredVariations.map((v) => v.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleApply() {
    setMessage(null)
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Select at least one variation.' })
      return
    }
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
      const result = await bulkUpdateVariations(productId, Array.from(selectedIds), changes)
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Updated ${result.updated} variation${result.updated !== 1 ? 's' : ''}. Refreshing…`,
        })
        setSelectedIds(new Set())
        setPrice('')
        setCapacity('')
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <>
      <DrawerToggler slug={drawerSlug} className="btn btn--style-secondary btn--size-medium">
        Bulk Edit Variations
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="Bulk Edit Variations" gutter>
        <div style={{ padding: '1.5rem', maxWidth: '680px' }}>
          <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Filter variations, select rows, then apply a new price or capacity. Changes save immediately.
          </p>

          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-elevation-600)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                City
              </label>
              <select
                value={cityFilter}
                onChange={(e) => { setCityFilter(e.target.value); setSchoolFilter('') }}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--theme-border-color)', borderRadius: '4px', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', fontSize: '0.875rem' }}
              >
                <option value="">All cities</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-elevation-600)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                School
              </label>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                disabled={!cityFilter}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--theme-border-color)', borderRadius: '4px', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', fontSize: '0.875rem', opacity: cityFilter ? 1 : 0.5 }}
              >
                <option value="">All schools</option>
                {filteredSchools.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-elevation-600)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Season
              </label>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--theme-border-color)', borderRadius: '4px', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', fontSize: '0.875rem' }}
              >
                <option value="">All seasons</option>
                {seasons.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>

          {/* Variations table */}
          <div style={{ border: '1px solid var(--theme-border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--theme-elevation-50)', borderBottom: '1px solid var(--theme-border-color)' }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', width: '2.5rem' }}>
                    <input
                      type="checkbox"
                      checked={filteredVariations.length > 0 && selectedIds.size === filteredVariations.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--theme-elevation-600)' }}>School</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--theme-elevation-600)' }}>Season</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--theme-elevation-600)' }}>Price</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--theme-elevation-600)' }}>Cap.</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1rem 0.75rem', color: 'var(--theme-elevation-400)', textAlign: 'center' }}>
                      No variations match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVariations.map((v) => (
                    <tr
                      key={v.id}
                      style={{
                        borderTop: '1px solid var(--theme-elevation-100)',
                        background: selectedIds.has(v.id) ? 'var(--theme-elevation-50)' : undefined,
                      }}
                    >
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input type="checkbox" checked={selectedIds.has(v.id)} onChange={() => toggleOne(v.id)} />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--theme-text)' }}>{v.schoolTitle || v.schoolId}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--theme-elevation-500)' }}>{v.seasonTitle || v.seasonId}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--theme-elevation-500)' }}>{formatPrice(v.price)}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--theme-elevation-500)' }}>{v.capacity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-400)', marginBottom: '1rem' }}>
            {selectedIds.size} of {filteredVariations.length} selected
          </p>

          {/* Price / Capacity inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-elevation-600)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                New Price ($ CAD)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Leave blank to keep"
                min={0}
                step={0.01}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--theme-border-color)', borderRadius: '4px', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-elevation-600)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                New Capacity
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Leave blank to keep"
                min={1}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--theme-border-color)', borderRadius: '4px', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', fontSize: '0.875rem' }}
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
            disabled={isPending || selectedIds.size === 0}
            className="btn btn--style-primary btn--size-medium"
          >
            {isPending ? 'Applying…' : `Apply to ${selectedIds.size} Variation${selectedIds.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </Drawer>
    </>
  )
}
