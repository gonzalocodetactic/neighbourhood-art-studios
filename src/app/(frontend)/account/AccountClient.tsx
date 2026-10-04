'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  firstName: string
  lastName: string
  age: string
  grade: string
  teacherName: string
  divisionNumber: string
}

// Age as of today: add a year for each year since the registration it was recorded on.
// 11+ months counts as a year, so last fall's class rolls into this fall's.
// Parents can still correct it in the form.
function ageSince(age: string, recordedAt: string): string {
  const n = parseInt(age, 10)
  const then = new Date(recordedAt)
  if (Number.isNaN(n) || Number.isNaN(then.getTime())) return age
  const now = new Date()
  const months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
  return String(n + Math.max(0, Math.floor((months + 1) / 12)))
}

type Registration = {
  id: string
  productTitle: string
  productId: string
  schoolName: string
  seasonName: string
  studentCount: number
  unitPrice: number
  subtotal: number
  gstAmount: number
  totalAmount: number
  paymentStatus: string
  attendanceStatus: string
  monerisOrderId: string
  createdAt: string
  students: Student[]
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  ecFirstName: string
  ecLastName: string
  ecPhone: string
  ecEmail: string
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  billingStreet: string
  billingCity: string
  billingProvince: string
  billingPostalCode: string
  savedPaymentToken: string
  savedPaymentLast4: string
  savedPaymentExpiry: string
}

const INPUT = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30'

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    refunded: 'bg-gray-100 text-gray-600',
    waived: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function MsgBanner({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null
  return (
    <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {msg.text}
    </div>
  )
}

function printReceipt(r: Registration, user: User) {
  const date = r.createdAt
    ? new Date(r.createdAt).toLocaleString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''
  const billingLines = [
    r.parentFirstName && r.parentLastName ? `${r.parentFirstName} ${r.parentLastName}` : '',
    r.parentEmail,
    r.parentPhone,
    user.billingStreet,
    [user.billingCity, user.billingProvince, user.billingPostalCode].filter(Boolean).join(', '),
  ].filter(Boolean).join('<br>')
  const studentRows = r.students.map((s) => {
    const cols = [
      `${s.firstName} ${s.lastName}`,
      s.grade || '—',
      s.age ? `Age ${s.age}` : '—',
      s.divisionNumber || '—',
      s.teacherName || '—',
    ]
    return `<tr>${cols.map((c) => `<td style="padding:4px 8px">${c}</td>`).join('')}</tr>`
  }).join('')
  const w = window.open('', '_blank', 'width=680,height=900')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt — ${r.productTitle}</title>
<style>
  body{font-family:-apple-system,sans-serif;color:#111;padding:48px;max-width:600px;margin:0 auto}
  h1{color:#3B4BC8;font-size:22px;margin-bottom:4px}
  .sub{color:#888;font-size:13px;margin-bottom:32px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;padding:4px 8px;font-size:12px;color:#666;border-bottom:1px solid #eee}
  td{font-size:14px}
  .totals td{padding:4px 8px;font-size:14px}
  .totals tr:last-child td{font-weight:600;border-top:1px solid #eee;padding-top:8px}
  .meta{margin-bottom:24px;font-size:14px;line-height:1.8}
  .section{margin-bottom:20px}
  @media print{body{padding:24px}}
</style></head><body>
<h1>Neighbourhood Art Studios</h1>
<p class="sub">Registration Receipt</p>
<div class="section meta">
  <strong>Program:</strong> ${r.productTitle}<br>
  <strong>School:</strong> ${r.schoolName}<br>
  <strong>Season:</strong> ${r.seasonName}<br>
  <strong>Date Paid:</strong> ${date}<br>
  ${r.monerisOrderId ? `<strong>Order ID:</strong> ${r.monerisOrderId}<br>` : ''}
  <strong>Status:</strong> ${r.paymentStatus.charAt(0).toUpperCase() + r.paymentStatus.slice(1)}
</div>
<div class="section">
  <strong>Billing Information</strong><br>
  <span style="color:#555">${billingLines}</span>
</div>
<div class="section">
  <table>
    <thead><tr><th>Student</th><th>Grade</th><th>Age</th><th>Division</th><th>Teacher</th></tr></thead>
    <tbody>${studentRows}</tbody>
  </table>
</div>
<table class="totals">
  <tbody>
    <tr><td>Subtotal (${r.studentCount} × ${formatCents(r.unitPrice)})</td><td style="text-align:right">${formatCents(r.subtotal)}</td></tr>
    <tr><td>GST (5%)</td><td style="text-align:right">${formatCents(r.gstAmount)}</td></tr>
    <tr><td>Total</td><td style="text-align:right">${formatCents(r.totalAmount)}</td></tr>
  </tbody>
</table>
<br><br>
<p style="font-size:12px;color:#999">Thank you for registering with Neighbourhood Art Studios.</p>
<script>window.onload=()=>{window.print()}</script>
</body></html>`)
  w.document.close()
}

export default function AccountClient({
  user,
  registrations,
}: {
  user: User
  registrations: Registration[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'orders' | 'students' | 'settings'>('orders')
  const [isPending, startTransition] = useTransition()

  // Order drawer
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  // Settings — profile
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [phone, setPhone] = useState(user.phone)
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Settings — billing address
  const [billingStreet, setBillingStreet] = useState(user.billingStreet)
  const [billingCity, setBillingCity] = useState(user.billingCity)
  const [billingProvince, setBillingProvince] = useState(user.billingProvince)
  const [billingPostalCode, setBillingPostalCode] = useState(user.billingPostalCode)
  const [billingMsg, setBillingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Settings — password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Settings — delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Add Student modal
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [addFirst, setAddFirst] = useState('')
  const [addLast, setAddLast] = useState('')
  const [addAge, setAddAge] = useState('')
  const [addGrade, setAddGrade] = useState('')

  function handleLogout() {
    startTransition(async () => {
      await fetch('/api/parents/logout', { method: 'POST', credentials: 'include' })
      router.push('/account/login')
      router.refresh()
    })
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSettingsMsg(null)
    startTransition(async () => {
      const res = await fetch(`/api/parents/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, phone }),
      })
      if (res.ok) {
        setSettingsMsg({ type: 'success', text: 'Profile updated.' })
        router.refresh()
      } else {
        setSettingsMsg({ type: 'error', text: 'Failed to update profile.' })
      }
    })
  }

  function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault()
    setBillingMsg(null)
    startTransition(async () => {
      const res = await fetch(`/api/parents/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ billingAddress: { street: billingStreet, city: billingCity, province: billingProvince, postalCode: billingPostalCode } }),
      })
      if (res.ok) {
        setBillingMsg({ type: 'success', text: 'Billing address saved.' })
      } else {
        setBillingMsg({ type: 'error', text: 'Failed to save billing address.' })
      }
    })
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setSettingsMsg(null)
    if (!currentPassword || !newPassword) {
      setSettingsMsg({ type: 'error', text: 'All password fields are required.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setSettingsMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setSettingsMsg({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/parents/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setSettingsMsg({ type: 'success', text: 'Password changed.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json().catch(() => ({}))
        setSettingsMsg({ type: 'error', text: data?.error ?? 'Failed to change password.' })
      }
    })
  }

  function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteError('')
    startTransition(async () => {
      const res = await fetch('/api/parents/delete-account', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        router.push('/account/login')
      } else {
        setDeleteError('Could not delete account. Please contact support.')
      }
    })
  }

  function handleReenroll(student: Student, r: Registration) {
    const data = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      age: ageSince(student.age, r.createdAt),
      grade: student.grade,
      teacherName: student.teacherName,
      divisionNumber: student.divisionNumber,
      parentFirstName: r.parentFirstName,
      parentLastName: r.parentLastName,
      parentEmail: r.parentEmail,
      parentPhone: r.parentPhone,
      ecFirstName: r.ecFirstName,
      ecLastName: r.ecLastName,
      ecPhone: r.ecPhone,
      ecEmail: r.ecEmail,
    }
    try {
      sessionStorage.setItem(`nas_student_${student.id}`, JSON.stringify(data))
    } catch { /* ignore */ }
    router.push(`/register?studentId=${student.id}`)
  }

  function handleAddStudentSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = crypto.randomUUID()
    const data = {
      id,
      firstName: addFirst,
      lastName: addLast,
      age: addAge,
      grade: addGrade,
      teacherName: '',
      divisionNumber: '',
      parentFirstName: user.firstName,
      parentLastName: user.lastName,
      parentEmail: user.email,
      parentPhone: user.phone,
      ecFirstName: '',
      ecLastName: '',
      ecPhone: '',
      ecEmail: '',
    }
    try {
      sessionStorage.setItem(`nas_student_${id}`, JSON.stringify(data))
    } catch { /* ignore */ }
    router.push(`/register?studentId=${id}`)
  }

  const seenIds = new Set<string>()
  const allStudents: Array<Student & { regId: string; productTitle: string }> = registrations.flatMap((r) =>
    r.students
      .filter((s) => {
        if (seenIds.has(s.id)) return false
        seenIds.add(s.id)
        return true
      })
      .map((s) => ({ ...s, regId: r.id, productTitle: r.productTitle })),
  )
  const studentToReg = new Map<string, Registration>(
    registrations.flatMap((r) => r.students.map((s) => [s.id, r] as [string, Registration])),
  )

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-full transition ${tab === t ? 'bg-[#3B4BC8] text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#3B4BC8]">Parent Portal</h1>
            <p className="text-sm text-gray-500">Welcome back, {user.firstName}!</p>
          </div>
          <button onClick={handleLogout} disabled={isPending} className="text-sm text-gray-500 hover:text-red-600 transition">
            Sign out
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-white rounded-full p-1 shadow-sm border border-gray-100 w-fit">
          <button className={tabClass('orders')} onClick={() => setTab('orders')}>Order History</button>
          <button className={tabClass('students')} onClick={() => setTab('students')}>Students Registered</button>
          <button className={tabClass('settings')} onClick={() => setTab('settings')}>Account Settings</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* ── Order History ──────────────────────────────────────────────── */}
          {tab === 'orders' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order History</h2>
              {registrations.length === 0 ? (
                <p className="text-sm text-gray-500">No registrations yet.</p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((r) => {
                    const expanded = expandedOrderId === r.id
                    const billingAddress = [user.billingStreet, user.billingCity, user.billingProvince, user.billingPostalCode].filter(Boolean).join(', ')
                    return (
                      <div key={r.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(expanded ? null : r.id)}
                          className="w-full text-left p-4 hover:bg-gray-50/60 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800">{r.productTitle}</p>
                              <p className="text-xs text-gray-500">{r.schoolName} · {r.seasonName}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {r.studentCount} student{r.studentCount !== 1 ? 's' : ''} · {formatCents(r.totalAmount)}
                                {r.createdAt && (
                                  <> · {new Date(r.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={r.paymentStatus} />
                              <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
                            </div>
                          </div>
                        </button>

                        {expanded && (
                          <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/40 space-y-5 text-sm">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {r.createdAt && (
                                <>
                                  <span className="text-gray-500">Date Paid</span>
                                  <span className="text-gray-800">
                                    {new Date(r.createdAt).toLocaleString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                              {r.monerisOrderId && (
                                <>
                                  <span className="text-gray-500">Order ID</span>
                                  <span className="text-gray-800 font-mono text-xs">{r.monerisOrderId}</span>
                                </>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Breakdown</p>
                              <div className="space-y-1">
                                <div className="flex justify-between text-gray-700">
                                  <span>Subtotal ({r.studentCount} × {formatCents(r.unitPrice)})</span>
                                  <span>{formatCents(r.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                  <span>GST (5%)</span>
                                  <span>{formatCents(r.gstAmount)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-200 pt-1 mt-1">
                                  <span>Total</span>
                                  <span>{formatCents(r.totalAmount)}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Students Registered</p>
                              <div className="space-y-1.5">
                                {r.students.map((s, i) => (
                                  <div key={i} className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-700">
                                    <span className="font-medium">{s.firstName} {s.lastName}</span>
                                    {s.age && <span className="text-gray-500">Age {s.age}</span>}
                                    {s.grade && <span className="text-gray-500">{s.grade}</span>}
                                    {s.divisionNumber && <span className="text-gray-500">Div. {s.divisionNumber}</span>}
                                    {s.teacherName && <span className="text-gray-500">{s.teacherName}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Billing Information</p>
                              <div className="text-gray-700 space-y-0.5">
                                <p>{r.parentFirstName} {r.parentLastName}</p>
                                {r.parentEmail && <p className="text-gray-500">{r.parentEmail}</p>}
                                {r.parentPhone && <p className="text-gray-500">{r.parentPhone}</p>}
                                {billingAddress && <p className="text-gray-500">{billingAddress}</p>}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => printReceipt(r, user)}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3B4BC8] border border-[#3B4BC8]/30 rounded-lg px-4 py-2 hover:bg-[#3B4BC8]/5 transition"
                            >
                              Print Receipt
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Students Registered ────────────────────────────────────────── */}
          {tab === 'students' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Students Registered</h2>
                <button
                  type="button"
                  onClick={() => { setShowAddStudent(true); setAddFirst(''); setAddLast(''); setAddAge(''); setAddGrade('') }}
                  className="bg-[#3B4BC8] text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#2d3aaa] transition"
                >
                  + Add Student
                </button>
              </div>
              {allStudents.length === 0 ? (
                <p className="text-sm text-gray-500">No students registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {allStudents.map((s) => {
                    const reg = studentToReg.get(s.id)
                    return (
                      <div key={s.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[s.age && `Age ${s.age}`, s.grade, s.divisionNumber && `Div. ${s.divisionNumber}`, s.teacherName].filter(Boolean).join(' · ')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.productTitle}</p>
                        </div>
                        {reg && (
                          <button
                            type="button"
                            onClick={() => handleReenroll(s, reg)}
                            className="shrink-0 text-xs text-[#3B4BC8] border border-[#3B4BC8]/30 rounded-lg px-3 py-1.5 hover:bg-[#3B4BC8]/5 transition whitespace-nowrap"
                          >
                            Re-enroll
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Account Settings ───────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Account Settings</h2>

              {/* Profile */}
              <MsgBanner msg={settingsMsg} />
              <form onSubmit={handleSaveProfile} className="space-y-4 mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} />
                </div>
                <p className="text-xs text-gray-400">Email: {user.email}</p>
                <button type="submit" disabled={isPending} className="bg-[#3B4BC8] text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-[#2d3aaa] transition disabled:opacity-50">
                  {isPending ? 'Saving…' : 'Save Profile'}
                </button>
              </form>

              <hr className="border-gray-100 mb-6" />

              {/* Billing Address */}
              <MsgBanner msg={billingMsg} />
              <form onSubmit={handleSaveBilling} className="space-y-4 mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Billing Address</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input type="text" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} placeholder="123 Main St" className={INPUT} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input type="text" value={billingProvince} onChange={(e) => setBillingProvince(e.target.value)} placeholder="BC" className={INPUT} />
                  </div>
                </div>
                <div className="max-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input type="text" value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} placeholder="V1V 1V1" className={INPUT} />
                </div>
                <button type="submit" disabled={isPending} className="bg-[#3B4BC8] text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-[#2d3aaa] transition disabled:opacity-50">
                  {isPending ? 'Saving…' : 'Save Address'}
                </button>
              </form>

              <hr className="border-gray-100 mb-6" />

              {/* Saved Payment Methods */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Saved Payment Methods</h3>
                {user.savedPaymentLast4 ? (
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 max-w-sm">
                    <div className="w-10 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-md flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold leading-none">VISA</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Visa ending in {user.savedPaymentLast4}</p>
                      {user.savedPaymentExpiry && <p className="text-xs text-gray-500">Expires {user.savedPaymentExpiry}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No saved payment method. Payment is processed via Moneris at checkout.</p>
                )}
              </div>

              <hr className="border-gray-100 mb-6" />

              {/* Change Password */}
              <form onSubmit={handleChangePassword} className="space-y-4 mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Change Password</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={INPUT} />
                </div>
                <button type="submit" disabled={isPending} className="bg-gray-800 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50">
                  {isPending ? 'Updating…' : 'Change Password'}
                </button>
              </form>

              <hr className="border-gray-100 mb-6" />

              {/* Delete Account */}
              <div className="border border-red-200 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText('') }}
                    className="text-sm font-semibold text-red-600 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-50 transition"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">Type <strong>DELETE</strong> to confirm:</p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteConfirmText !== 'DELETE' || isPending}
                        onClick={handleDeleteAccount}
                        className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40"
                      >
                        {isPending ? 'Deleting…' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Student Modal ──────────────────────────────────────────────── */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Add a Student</h2>
              <button type="button" onClick={() => setShowAddStudent(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Close">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {"Enter your student's details and you'll be taken to the registration form with their info pre-filled."}
            </p>
            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={addFirst} onChange={(e) => setAddFirst(e.target.value)} required className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={addLast} onChange={(e) => setAddLast(e.target.value)} className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input type="number" min={4} max={18} value={addAge} onChange={(e) => setAddAge(e.target.value)} placeholder="e.g. 8" className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <input type="text" value={addGrade} onChange={(e) => setAddGrade(e.target.value)} placeholder="e.g. Grade 3" className={INPUT} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#3B4BC8] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#2d3aaa] transition">
                  Continue to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
