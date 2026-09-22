'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type OrderData = {
  orderId: string
  createdAt: string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  students: { firstName: string; lastName?: string }[]
  product: string
  classDate: string | null
  paymentStatus: string
  totalPaid: number | null
}

type Props = {
  heading?: string | null
  subheading?: string | null
  supportText?: string | null
  showPrintButton?: boolean | null
  homeButtonText?: string | null
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-gray-100 text-gray-600',
  waived: 'bg-blue-100 text-blue-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pr-6 text-sm text-gray-500 font-medium w-44 align-top">{label}</td>
      <td className="py-3 text-sm text-gray-800">{value}</td>
    </tr>
  )
}

function OrderSummaryInner({
  heading = 'Thank you for your registration!',
  subheading = 'Here are your registration details and receipt summary.',
  supportText,
  showPrintButton = true,
  homeButtonText = 'Return to Home',
}: Props) {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') ?? searchParams.get('session_id') ?? null

  const [order, setOrder] = useState<OrderData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'not_found'>('idle')

  const fetchOrder = useCallback(async (id: string) => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/order/${encodeURIComponent(id)}`)
      if (res.status === 404) { setStatus('not_found'); return }
      if (!res.ok) { setStatus('error'); return }
      setOrder(await res.json())
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (orderId) fetchOrder(orderId)
  }, [orderId, fetchOrder])

  return (
    <section className="min-h-[60vh] bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {heading}
        </h1>
        {subheading && (
          <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">{subheading}</p>
        )}

        {/* Order card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">

          {/* Card header */}
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <span
              className="text-base font-semibold text-gray-800"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Registration Details
            </span>
            {order && (
              <span className="text-xs text-gray-400 font-mono">#{order.orderId}</span>
            )}
          </div>

          <div className="px-8 py-6">
            {!orderId && (
              <p className="text-gray-400 text-sm text-center py-4">
                No order ID found. This page displays confirmation details after a completed registration.
              </p>
            )}

            {orderId && status === 'loading' && (
              <div className="flex items-center justify-center py-8 gap-3 text-gray-400 text-sm">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Loading your order…
              </div>
            )}

            {status === 'not_found' && (
              <p className="text-gray-400 text-sm text-center py-4">
                Order <span className="font-mono text-xs">{orderId}</span> not found.
              </p>
            )}

            {status === 'error' && (
              <p className="text-red-400 text-sm text-center py-4">
                Unable to load order details. Please contact us if this persists.
              </p>
            )}

            {order && (
              <table className="w-full">
                <tbody>
                  <Row label="Order #" value={<span className="font-mono text-xs">{order.orderId}</span>} />
                  <Row label="Date" value={formatDate(order.createdAt)} />
                  <Row
                    label="Student(s)"
                    value={order.students.length > 0
                      ? order.students.map(s => [s.firstName, s.lastName].filter(Boolean).join(' ')).join(', ')
                      : '—'
                    }
                  />
                  <Row label="Program" value={order.product} />
                  {order.classDate && <Row label="Schedule" value={order.classDate} />}
                  <Row
                    label="Payment Status"
                    value={<StatusBadge status={order.paymentStatus} />}
                  />
                  {order.totalPaid != null && (
                    <Row
                      label="Total Paid"
                      value={`$${Number(order.totalPaid).toFixed(2)} CAD`}
                    />
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Support text */}
        {supportText && (
          <div className="bg-[#3B4BC8]/5 rounded-xl border border-[#3B4BC8]/10 px-6 py-5 mb-8">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{supportText}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#3B4BC8] hover:bg-[#2f3da0] rounded-lg transition-colors"
          >
            {homeButtonText ?? 'Return to Home'}
          </a>
          {showPrintButton && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
            >
              Print Receipt
            </button>
          )}
        </div>

      </div>
    </section>
  )
}

export function OrderSummaryBlock(props: Props) {
  return (
    <Suspense>
      <OrderSummaryInner {...props} />
    </Suspense>
  )
}
