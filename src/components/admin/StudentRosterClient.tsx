'use client'

import { useState } from 'react'

export type RosterRow = {
  // student
  firstName: string
  lastName: string
  age: string
  grade: string
  gender: string
  medicalNotes: string
  emergencyContactName: string
  emergencyContactPhone: string
  // parent
  parentName: string
  parentEmail: string
  parentPhone: string
  // order
  orderId: string
  legacyWooOrderId: string
  paymentStatus: string
  totalAmount: number | null
  unitPrice: number | null
  // class
  product: string
  school: string
  classDate: string
  attendanceStatus: string
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-gray-100 text-gray-600',
  waived: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-indigo-100 text-indigo-700',
  attended: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-orange-100 text-orange-700',
}

function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_COLORS[value] ?? 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  )
}

function fmtCents(cents: number | null) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

function toCsv(rows: RosterRow[]): string {
  const headers = [
    'Student First Name', 'Student Last Name', 'Age', 'Grade', 'Gender',
    'Medical Notes', 'Emergency Contact Name', 'Emergency Contact Phone',
    'Parent Name', 'Parent Email', 'Parent Phone',
    'Moneris Order ID', 'Legacy WooCommerce ID',
    'Payment Status', 'Attendance Status', 'Unit Price', 'Total Amount',
    'Product', 'School', 'Class Date',
  ]
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const dataRows = rows.map(r => [
    r.firstName, r.lastName, r.age, r.grade, r.gender,
    r.medicalNotes, r.emergencyContactName, r.emergencyContactPhone,
    r.parentName, r.parentEmail, r.parentPhone,
    r.orderId, r.legacyWooOrderId,
    r.paymentStatus, r.attendanceStatus,
    r.unitPrice != null ? String(r.unitPrice / 100) : '',
    r.totalAmount != null ? String(r.totalAmount / 100) : '',
    r.product, r.school, r.classDate,
  ].map(escape).join(','))
  return [headers.map(escape).join(','), ...dataRows].join('\r\n')
}

export function StudentRosterClient({ rows }: { rows: RosterRow[] }) {
  const [query, setQuery] = useState('')
  const [payFilter, setPayFilter] = useState('')

  const filtered = rows.filter(r => {
    const q = query.toLowerCase()
    const matchesSearch = !q || [r.firstName, r.lastName, r.parentName, r.parentEmail, r.product, r.school, r.orderId].some(v => v.toLowerCase().includes(q))
    const matchesPay = !payFilter || r.paymentStatus === payFilter
    return matchesSearch && matchesPay
  })

  function downloadCsv() {
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student-roster-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Student Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} student row{filtered.length !== 1 ? 's' : ''}{filtered.length !== rows.length ? ` (filtered from ${rows.length})` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          disabled={filtered.length === 0}
        >
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, email, product, order…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-72"
        />
        <select
          value={payFilter}
          onChange={e => setPayFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All payment statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="waived">Waived</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No registrations found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Student', 'Age / Grade', 'Medical', 'Emergency Contact',
                  'Parent', 'Contact', 'Order ID', 'Payment', 'Attendance',
                  'Amount', 'Product', 'School', 'Class Date',
                ].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {[r.firstName, r.lastName].filter(Boolean).join(' ')}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {[r.age && `Age ${r.age}`, r.grade].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-500 max-w-[160px] whitespace-normal text-xs">
                    {r.medicalNotes || '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    {r.emergencyContactName && <div>{r.emergencyContactName}</div>}
                    {r.emergencyContactPhone && <div className="text-gray-400">{r.emergencyContactPhone}</div>}
                    {!r.emergencyContactName && !r.emergencyContactPhone && '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-800">{r.parentName}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    <div>{r.parentEmail}</div>
                    {r.parentPhone && <div className="text-gray-400">{r.parentPhone}</div>}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-500">
                    {r.orderId || '—'}
                    {r.legacyWooOrderId && (
                      <div className="text-gray-400">WC: {r.legacyWooOrderId}</div>
                    )}
                  </td>
                  <td className="px-3 py-2"><Badge value={r.paymentStatus} /></td>
                  <td className="px-3 py-2"><Badge value={r.attendanceStatus} /></td>
                  <td className="px-3 py-2 text-gray-600">{fmtCents(r.totalAmount)}</td>
                  <td className="px-3 py-2 text-gray-800">{r.product || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{r.school || '—'}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{r.classDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
