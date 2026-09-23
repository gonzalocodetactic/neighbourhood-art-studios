'use client'

import { useState, useEffect } from 'react'

export type AnalyticsData = {
  range: { start: string; end: string }
  current: {
    grossSales: number
    netSales: number
    totalGst: number
    totalOrders: number
    studentsEnrolled: number
  }
  comparison: {
    grossSales: number
    netSales: number
    totalOrders: number
    studentsEnrolled: number
  }
  salesByCity: Array<{ city: string; orders: number; students: number; grossSales: number; netSales: number }>
  variationPerformance: Array<{
    key: string
    productTitle: string
    school: string
    season: string
    city: string
    orders: number
    students: number
    netSales: number
    capacity: number
    fillRate: number
  }>
  dailyTrends: Array<{ date: string; revenue: number; orders: number }>
  taxSummary: { code: string; rate: string; taxableAmount: number; totalGst: number }
}

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Month to Date' },
  { value: 'quarter', label: 'Quarter to Date' },
  { value: 'year', label: 'Year to Date' },
]

function fmtCAD(n: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
}

function deltaBadge(current: number, prev: number): { text: string; positive: boolean | null } {
  if (current === 0 && prev === 0) return { text: '—', positive: null }
  if (prev === 0 && current > 0) return { text: 'New', positive: true }
  const pct = ((current - prev) / prev) * 100
  return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 }
}

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  const { text, positive } = deltaBadge(current, prev)
  if (positive === null) return <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>{text}</span>
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 600,
      background: positive ? '#dcfce7' : '#fee2e2',
      color: positive ? '#16a34a' : '#dc2626',
    }}>
      {text}
    </span>
  )
}

function KpiCard({ title, value, current, prev }: { title: string; value: string; current: number; prev: number }) {
  return (
    <div style={{
      background: 'var(--theme-elevation-0)',
      border: '1px solid var(--theme-border-color)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-elevation-500)', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--theme-text)', margin: 0, lineHeight: 1 }}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <DeltaBadge current={current} prev={prev} />
        <span style={{ fontSize: 11, color: 'var(--theme-elevation-500)' }}>vs prev period</span>
      </div>
    </div>
  )
}

function LineChart({ data }: { data: AnalyticsData['dailyTrends'] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-elevation-500)', fontSize: 13 }}>
        No data for this period
      </div>
    )
  }

  const W = 600
  const H = 220
  const pad = { top: 20, right: 50, bottom: 35, left: 70 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom

  const maxRev = Math.max(...data.map(d => d.revenue), 0.01)
  const maxOrd = Math.max(...data.map(d => d.orders), 1)
  const xStep = data.length > 1 ? cw / (data.length - 1) : cw

  const revPoints = data.map((d, i) => ({ x: i * xStep, y: ch - (d.revenue / maxRev) * ch }))
  const ordPoints = data.map((d, i) => ({ x: i * xStep, y: ch - (d.orders / maxOrd) * ch }))

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const labelEvery = Math.max(1, Math.floor(data.length / 8))
  const gridTicks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {gridTicks.map(t => {
          const y = ch - t * ch
          return (
            <g key={t}>
              <line x1={0} y1={y} x2={cw} y2={y} stroke="var(--theme-border-color)" strokeWidth={1} />
              <text x={-6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--theme-elevation-500)">
                {fmtCAD(t * maxRev)}
              </text>
            </g>
          )
        })}

        {/* Right axis for orders */}
        {gridTicks.map(t => {
          const y = ch - t * ch
          return (
            <text key={`r${t}`} x={cw + 6} y={y + 4} textAnchor="start" fontSize={10} fill="#10b981">
              {Math.round(t * maxOrd)}
            </text>
          )
        })}

        <path d={toPath(revPoints)} fill="none" stroke="#3B4BC8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(ordPoints)} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />

        {/* X labels */}
        {data.map((d, i) => {
          if (i % labelEvery !== 0 && i !== data.length - 1) return null
          return (
            <text key={d.date} x={i * xStep} y={ch + 18} textAnchor="middle" fontSize={9} fill="var(--theme-elevation-500)">
              {d.date.slice(5)}
            </text>
          )
        })}

        {/* Axis lines */}
        <line x1={0} y1={0} x2={0} y2={ch} stroke="var(--theme-border-color)" strokeWidth={1} />
        <line x1={0} y1={ch} x2={cw} y2={ch} stroke="var(--theme-border-color)" strokeWidth={1} />
      </g>
    </svg>
  )
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--theme-elevation-0)',
  border: '1px solid var(--theme-border-color)',
  borderRadius: 12,
  padding: 24,
}

const TH_STYLE: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--theme-elevation-500)',
  borderBottom: '1px solid var(--theme-border-color)',
  whiteSpace: 'nowrap',
}

const TD_STYLE: React.CSSProperties = {
  padding: '10px',
  fontSize: 13,
  color: 'var(--theme-text)',
  borderBottom: '1px solid var(--theme-border-color)',
}

export default function AnalyticsDashboardClient({ initialData }: { initialData: AnalyticsData }) {
  const [range, setRange] = useState('month')
  const [data, setData] = useState<AnalyticsData>(initialData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (range === 'month') return
    setLoading(true)
    fetch(`/api/admin/analytics?range=${range}`)
      .then(r => r.json())
      .then((d: AnalyticsData) => setData(d))
      .catch(() => {/* silently ignore fetch errors */})
      .finally(() => setLoading(false))
  }, [range])

  function exportCsv() {
    const rows = data.variationPerformance
    const lines = [
      ['Program', 'School', 'Season', 'City', 'Enrolled', 'Net Sales', 'Capacity', 'Fill Rate %', 'Status'].join(','),
      ...rows.map(r => [
        `"${r.productTitle}"`,
        `"${r.school}"`,
        `"${r.season}"`,
        `"${r.city}"`,
        r.students,
        r.netSales.toFixed(2),
        r.capacity,
        r.fillRate,
        r.students >= r.capacity ? 'Sold Out' : 'In Stock',
      ].join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const rangeLabel = `${new Date(data.range.start).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })} → ${new Date(data.range.end).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header + toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--theme-text)' }}>Analytics</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--theme-elevation-500)' }}>{rangeLabel}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {loading && <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>Loading…</span>}
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--theme-border-color)', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', fontSize: 13, cursor: 'pointer' }}
          >
            {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard title="Gross Sales" value={fmtCAD(data.current.grossSales)} current={data.current.grossSales} prev={data.comparison.grossSales} />
        <KpiCard title="Net Sales" value={fmtCAD(data.current.netSales)} current={data.current.netSales} prev={data.comparison.netSales} />
        <KpiCard title="Total Orders" value={String(data.current.totalOrders)} current={data.current.totalOrders} prev={data.comparison.totalOrders} />
        <KpiCard title="Students Enrolled" value={String(data.current.studentsEnrolled)} current={data.current.studentsEnrolled} prev={data.comparison.studentsEnrolled} />
      </div>

      {/* Revenue trend chart */}
      <div style={{ ...CARD_STYLE, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--theme-text)' }}>Revenue Trend</h2>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--theme-elevation-500)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 20, height: 2, background: '#3B4BC8' }} />
              Revenue
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 20, height: 2, background: '#10b981', borderTop: '2px dashed #10b981' }} />
              Orders
            </span>
          </div>
        </div>
        <LineChart data={data.dailyTrends} />
      </div>

      {/* City breakdown + Tax summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={CARD_STYLE}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--theme-text)' }}>Sales by City</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>City</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Students</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.salesByCity.length === 0 ? (
                <tr><td colSpan={3} style={{ ...TD_STYLE, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>No data</td></tr>
              ) : data.salesByCity.map(row => (
                <tr key={row.city}>
                  <td style={TD_STYLE}>{row.city}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{row.students}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 500 }}>{fmtCAD(row.netSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={CARD_STYLE}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--theme-text)' }}>Tax Summary</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Tax Code</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Taxable Amount</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>GST Collected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={TD_STYLE}>{data.taxSummary.code}</td>
                <td style={{ ...TD_STYLE, textAlign: 'right' }}>{fmtCAD(data.taxSummary.taxableAmount)}</td>
                <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 600 }}>{fmtCAD(data.taxSummary.totalGst)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--theme-elevation-50)', borderRadius: 8, fontSize: 12, color: 'var(--theme-elevation-500)' }}>
            GST rate: {data.taxSummary.rate} · Applies to all student registrations in BC · Registration number: CA-BC-GST
          </div>
        </div>
      </div>

      {/* Variation performance */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--theme-text)' }}>Variation Performance</h2>
          <button
            onClick={exportCsv}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--theme-border-color)', background: 'var(--theme-elevation-0)', color: 'var(--theme-text)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
          >
            Export CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH_STYLE, minWidth: 160 }}>Program</th>
                <th style={{ ...TH_STYLE, minWidth: 130 }}>School</th>
                <th style={{ ...TH_STYLE, minWidth: 110 }}>Season</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Enrolled</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Net Sales</th>
                <th style={{ ...TH_STYLE, minWidth: 120 }}>Fill Rate</th>
                <th style={{ ...TH_STYLE, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.variationPerformance.length === 0 ? (
                <tr><td colSpan={7} style={{ ...TD_STYLE, textAlign: 'center', color: 'var(--theme-elevation-500)' }}>No data for this period</td></tr>
              ) : data.variationPerformance.map(row => (
                <tr key={row.key}>
                  <td style={{ ...TD_STYLE, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.productTitle}</td>
                  <td style={{ ...TD_STYLE, color: 'var(--theme-elevation-700)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.school}</td>
                  <td style={{ ...TD_STYLE, color: 'var(--theme-elevation-700)', whiteSpace: 'nowrap' }}>{row.season}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right' }}>{row.students}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'right', fontWeight: 500 }}>{fmtCAD(row.netSales)}</td>
                  <td style={TD_STYLE}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--theme-border-color)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${row.fillRate}%`, height: '100%', background: row.fillRate >= 90 ? '#dc2626' : row.fillRate >= 70 ? '#f59e0b' : '#3B4BC8', borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--theme-elevation-700)', minWidth: 32, textAlign: 'right' }}>{row.fillRate}%</span>
                    </div>
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: row.students >= row.capacity ? '#fee2e2' : '#dcfce7',
                      color: row.students >= row.capacity ? '#dc2626' : '#16a34a',
                    }}>
                      {row.students >= row.capacity ? 'Sold Out' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
