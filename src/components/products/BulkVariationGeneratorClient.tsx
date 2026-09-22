'use client'

import { useState, useTransition } from 'react'
import { bulkUpdateVariations, generateVariations } from './bulkActions'

type ExistingVariation = {
  id: string
  schoolId: string
  seasonId: string
  price: number
  capacity: number
  schoolTitle: string
}

type Props = {
  productId: number | string | null
  cities: Array<{ id: number | string; title: string }>
  schools: Array<{ id: number | string; title: string; cityId: string }>
  fall2026SeasonId: string | null
  existingVariations: ExistingVariation[]
}

function formatPrice(dollars: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(dollars)
}

export default function BulkVariationGeneratorClient({
  productId,
  cities,
  schools,
  fall2026SeasonId,
  existingVariations,
}: Props) {
  const [cityId, setCityId] = useState('')
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set())
  const [price, setPrice] = useState('180.00')
  const [capacity, setCapacity] = useState('20')
  const [genMessage, setGenMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isGenerating, startGenerate] = useTransition()

  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkCapacity, setBulkCapacity] = useState('')
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isUpdating, startUpdate] = useTransition()

  if (!productId) {
    return (
      <div className="p-8 text-sm text-gray-500">
        Save the product first, then use this tab to generate variations.
      </div>
    )
  }

  const citySchools = schools.filter((s) => s.cityId === cityId)

  const existingFall2026Keys = new Set(
    existingVariations
      .filter((v) => v.seasonId === fall2026SeasonId)
      .map((v) => v.schoolId),
  )

  function toggleSchool(id: string) {
    setSelectedSchools((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedSchools.size === citySchools.length) {
      setSelectedSchools(new Set())
    } else {
      setSelectedSchools(new Set(citySchools.map((s) => String(s.id))))
    }
  }

  function handleGenerate() {
    setGenMessage(null)
    const priceVal = parseFloat(price)
    const capVal = parseInt(capacity, 10)
    if (!fall2026SeasonId) { setGenMessage({ type: 'error', text: 'No Fall 2026 season found.' }); return }
    if (selectedSchools.size === 0) { setGenMessage({ type: 'error', text: 'Select at least one school.' }); return }
    if (isNaN(priceVal) || priceVal < 0) { setGenMessage({ type: 'error', text: 'Enter a valid price.' }); return }
    if (isNaN(capVal) || capVal < 1) { setGenMessage({ type: 'error', text: 'Capacity must be at least 1.' }); return }

    startGenerate(async () => {
      const result = await generateVariations(
        productId!,
        cityId,
        Array.from(selectedSchools),
        priceVal,
        capVal,
        fall2026SeasonId,
      )
      if (result.success) {
        setGenMessage({ type: 'success', text: `Created ${result.created} variation${result.created !== 1 ? 's' : ''}${result.skipped > 0 ? `, skipped ${result.skipped} already existing` : ''}.` })
        setSelectedSchools(new Set())
      } else {
        setGenMessage({ type: 'error', text: result.error })
      }
    })
  }

  function toggleBulkAll() {
    if (bulkSelectedIds.size === existingVariations.length) {
      setBulkSelectedIds(new Set())
    } else {
      setBulkSelectedIds(new Set(existingVariations.map((v) => v.id)))
    }
  }

  function toggleBulkOne(id: string) {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleBulkUpdate() {
    setUpdateMessage(null)
    if (bulkSelectedIds.size === 0) { setUpdateMessage({ type: 'error', text: 'Select at least one variation.' }); return }
    const changes: { price?: number; capacity?: number } = {}
    if (bulkPrice.trim()) {
      const p = parseFloat(bulkPrice)
      if (isNaN(p) || p < 0) { setUpdateMessage({ type: 'error', text: 'Invalid price.' }); return }
      changes.price = p
    }
    if (bulkCapacity.trim()) {
      const c = parseInt(bulkCapacity, 10)
      if (isNaN(c) || c < 1) { setUpdateMessage({ type: 'error', text: 'Invalid capacity.' }); return }
      changes.capacity = c
    }
    if (!changes.price && !changes.capacity) { setUpdateMessage({ type: 'error', text: 'Enter a price or capacity to update.' }); return }

    startUpdate(async () => {
      const result = await bulkUpdateVariations(productId!, Array.from(bulkSelectedIds), changes)
      if (result.success) {
        setUpdateMessage({ type: 'success', text: `Updated ${result.updated} variation${result.updated !== 1 ? 's' : ''}.` })
        setBulkPrice('')
        setBulkCapacity('')
        setBulkSelectedIds(new Set())
      } else {
        setUpdateMessage({ type: 'error', text: result.error })
      }
    })
  }

  const priceVal = parseFloat(price)

  return (
    <div className="p-6 max-w-3xl space-y-10">

      {/* ── Section 1: Generate Variations ─────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Generate Variations</h2>
        <p className="text-sm text-gray-500 mb-5">
          Select a city and schools to bulk-create Fall 2026 variation slots for this product.
        </p>

        {!fall2026SeasonId && (
          <div className="mb-4 px-4 py-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
            No active &ldquo;Fall 2026&rdquo; season found. Create it in Seasons before generating variations.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
            <select
              value={cityId}
              onChange={(e) => { setCityId(e.target.value); setSelectedSchools(new Set()) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a city…</option>
              {cities.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{c.title}</option>
              ))}
            </select>
          </div>

          {cityId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600">
                  Schools ({citySchools.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedSchools.size === citySchools.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {citySchools.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400">No schools in this city.</p>
                ) : (
                  citySchools.map((s) => {
                    const sid = String(s.id)
                    const alreadyExists = existingFall2026Keys.has(sid)
                    return (
                      <label key={sid} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSchools.has(sid)}
                          onChange={() => toggleSchool(sid)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-800 flex-1">{s.title}</span>
                        {alreadyExists && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            exists
                          </span>
                        )}
                      </label>
                    )
                  })
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">{selectedSchools.size} selected</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price ($ CAD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
              {!isNaN(priceVal) && priceVal >= 0 && (
                <p className="mt-1 text-xs text-gray-400">{formatPrice(priceVal)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {genMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm ${genMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {genMessage.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !cityId || selectedSchools.size === 0 || !fall2026SeasonId}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating…' : `Generate ${selectedSchools.size} Variation${selectedSchools.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* ── Section 2: Bulk Update Existing ────────────────────────────────── */}
      {existingVariations.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Bulk Update Existing</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select variations and apply a new price or capacity to all selected rows at once.
          </p>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={bulkSelectedIds.size === existingVariations.length && existingVariations.length > 0}
                      onChange={toggleBulkAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">School</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Price</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {existingVariations.map((v) => (
                  <tr key={v.id} className={bulkSelectedIds.has(v.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={bulkSelectedIds.has(v.id)}
                        onChange={() => toggleBulkOne(v.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-800">{v.schoolTitle || v.schoolId}</td>
                    <td className="px-3 py-2 text-gray-600">{formatPrice(v.price)}</td>
                    <td className="px-3 py-2 text-gray-600">{v.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mb-3">{bulkSelectedIds.size} of {existingVariations.length} selected</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">New Price ($ CAD, optional)</label>
              <input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Leave blank to keep"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">New Capacity (optional)</label>
              <input
                type="number"
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(e.target.value)}
                placeholder="Leave blank to keep"
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {updateMessage && (
            <div className={`mb-3 px-4 py-3 rounded-lg text-sm ${updateMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {updateMessage.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleBulkUpdate}
            disabled={isUpdating || bulkSelectedIds.size === 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? 'Applying…' : `Apply to ${bulkSelectedIds.size} Selected`}
          </button>
        </div>
      )}
    </div>
  )
}
