'use client'

export default function TotalAmountCell({ cellData }: { cellData: unknown }) {
  const cents = typeof cellData === 'number' ? cellData : 0
  if (!cents) return <span style={{ color: '#9ca3af' }}>—</span>
  const formatted = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
  return <span>{formatted} CAD</span>
}
