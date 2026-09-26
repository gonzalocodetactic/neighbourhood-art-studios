'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { logoutFromRoster } from './actions'

export type RosterRow = {
  regId: string
  orderId: string
  studentIndex: string
  parentFirstName: string
  parentLastName: string
  phone: string
  email: string
  ecName: string
  ecPhone: string
  studentFirstName: string
  studentLastName: string
  gradeAge: string
  gender: string
  school: string
  schoolCity: string
  season: string
  divisionNumber: string
  teacherName: string
  scheduleDate: string
}

const TABS = [
  'Surrey Schools',
  'Burnaby Schools',
  'Richmond Schools',
  'Vancouver Schools',
  'Delta Schools',
  'Summer Camps',
  'Spring Break Camps',
] as const

type Tab = (typeof TABS)[number]

const COLUMNS: { key: keyof RosterRow; label: string; minW?: string }[] = [
  { key: 'regId',            label: 'ID',             minW: 'min-w-[60px]' },
  { key: 'orderId',          label: 'Order #',        minW: 'min-w-[80px]' },
  { key: 'studentIndex',     label: 'Stu #',          minW: 'min-w-[60px]' },
  { key: 'parentFirstName',  label: 'P/G FN #1',      minW: 'min-w-[100px]' },
  { key: 'parentLastName',   label: 'P/G LN #1',      minW: 'min-w-[100px]' },
  { key: 'phone',            label: 'Phone',           minW: 'min-w-[120px]' },
  { key: 'email',            label: 'P/G E-mail #1',  minW: 'min-w-[180px]' },
  { key: 'ecName',           label: 'E/C Name #1',    minW: 'min-w-[140px]' },
  { key: 'ecPhone',          label: 'E/C #1',         minW: 'min-w-[120px]' },
  { key: 'studentFirstName', label: 'SFN #1',         minW: 'min-w-[100px]' },
  { key: 'studentLastName',  label: 'SLN #1',         minW: 'min-w-[100px]' },
  { key: 'gradeAge',         label: 'Age #1 / Grade', minW: 'min-w-[100px]' },
  { key: 'gender',           label: 'Gender',         minW: 'min-w-[90px]' },
  { key: 'school',           label: 'School',         minW: 'min-w-[160px]' },
  { key: 'season',           label: 'Season',         minW: 'min-w-[100px]' },
  { key: 'divisionNumber',   label: 'Div #',          minW: 'min-w-[70px]' },
  { key: 'teacherName',      label: 'T. Name',        minW: 'min-w-[110px]' },
  { key: 'scheduleDate',     label: 'Date',           minW: 'min-w-[140px]' },
]

function filterByTab(rows: RosterRow[], tab: Tab): RosterRow[] {
  if (tab === 'Summer Camps') {
    return rows.filter((r) => r.season.toLowerCase().includes('summer'))
  }
  if (tab === 'Spring Break Camps') {
    return rows.filter((r) => r.season.toLowerCase().includes('spring'))
  }
  return rows.filter((r) => r.schoolCity === tab)
}

function applySearch(rows: RosterRow[], query: string): RosterRow[] {
  const trimmed = query.trim()
  if (!trimmed) return rows
  // "#63385" → exact legacy order match; otherwise substring match across all columns
  const orderMatch = trimmed.match(/^#\s*(\d+)$/)
  if (orderMatch) return rows.filter((row) => row.orderId === orderMatch[1])
  const q = trimmed.toLowerCase()
  return rows.filter((row) =>
    COLUMNS.some((c) => row[c.key].toLowerCase().includes(q)),
  )
}

type SortDirection = 'asc' | 'desc'

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

// Stable ordering: chosen column first, then registration ID and student index so
// siblings on one registration always stay in consecutive rows.
function sortRows(rows: RosterRow[], column: keyof RosterRow, direction: SortDirection): RosterRow[] {
  const dir = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const primary = column === 'studentIndex' ? 0 : collator.compare(a[column], b[column]) * dir
    if (primary !== 0) return primary
    const byReg = collator.compare(a.regId, b.regId) * (column === 'regId' ? dir : 1)
    if (byReg !== 0) return byReg
    return collator.compare(a.studentIndex, b.studentIndex) * (column === 'studentIndex' ? dir : 1)
  })
}

function toTSV(rows: RosterRow[]): string {
  const clean = (v: string) => v.replace(/[\t\r\n]+/g, ' ')
  const header = COLUMNS.map((c) => c.label).join('\t')
  const lines = rows.map((row) => COLUMNS.map((c) => clean(row[c.key])).join('\t'))
  return [header, ...lines].join('\n')
}

function toCSV(rows: RosterRow[], tabName: string): string {
  const header = COLUMNS.map((c) => c.label).join(',')
  const lines = rows.map((row) =>
    COLUMNS.map((c) => {
      const val = row[c.key]
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val
    }).join(','),
  )
  return [header, ...lines].join('\r\n')
}

export default function RosterClient({ rows }: { rows: RosterRow[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('Surrey Schools')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(100)
  const [isPending, startTransition] = useTransition()

  const tabRows = useMemo(() => filterByTab(rows, activeTab), [rows, activeTab])
  const [sortColumn, setSortColumn] = useState<keyof RosterRow>('regId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const filtered = useMemo(
    () => sortRows(applySearch(tabRows, search), sortColumn, sortDirection),
    [tabRows, search, sortColumn, sortDirection],
  )
  const displayed = filtered.slice(0, pageSize)

  function switchTab(tab: Tab) {
    setActiveTab(tab)
    setSearch('')
  }

  function handleSort(key: keyof RosterRow) {
    if (key === sortColumn) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toTSV(filtered))
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      window.alert('Could not copy to clipboard.')
    }
  }

  function handleExport() {
    const csv = toCSV(filtered, activeTab)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `roster-${activeTab.replace(/\s+/g, '-').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleLogout() {
    startTransition(async () => {
      await logoutFromRoster()
      window.location.reload()
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Neighbourhood Art Studios
          </p>
          <h1
            className="text-xl font-bold text-gray-900 leading-tight"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Student Roster
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#3B4BC8] bg-white border border-[#3B4BC8] rounded-lg hover:bg-[#3B4BC8]/5 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy CSV
            </button>
            {copied && (
              <span
                role="status"
                className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
              >
                Copied to clipboard!
              </span>
            )}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#3B4BC8] rounded-lg hover:bg-[#2D3AAA] active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 sticky top-[65px] z-10">
        <nav className="flex gap-0 overflow-x-auto scrollbar-none -mb-px">
          {TABS.map((tab) => {
            const count = filterByTab(rows, tab).length
            const active = tab === activeTab
            return (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-[#3B4BC8] text-[#3B4BC8]'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {tab}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-[#3B4BC8]/10 text-[#3B4BC8]'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          Show
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-[#3B4BC8]"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Search:</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter all columns or #order…"
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#3B4BC8] w-56"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      aria-sort={sortColumn === c.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                      onClick={() => handleSort(c.key)}
                      className={`px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 ${c.minW ?? ''}`}
                    >
                      {c.label}
                      {sortColumn === c.key && (
                        <span className="ml-1 text-[#3B4BC8]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td
                      colSpan={COLUMNS.length}
                      className="px-6 py-12 text-center text-sm text-gray-400"
                    >
                      {search
                        ? `No results match "${search}".`
                        : 'No registrations found for this category.'}
                    </td>
                  </tr>
                ) : (
                  displayed.map((row, i) => (
                    <tr
                      key={`${row.regId}-${i}`}
                      className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                      }`}
                    >
                      {COLUMNS.map((c) => (
                        <td
                          key={c.key}
                          className="px-3 py-2 text-gray-700 whitespace-nowrap"
                        >
                          {row[c.key] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-3 text-xs text-gray-400">
          Showing {Math.min(displayed.length, filtered.length)} of {filtered.length} entries
          {search && ` (filtered from ${tabRows.length} in this tab)`}
          {' · '}
          {rows.length} total registrations across all tabs
        </p>
      </div>
    </div>
  )
}
