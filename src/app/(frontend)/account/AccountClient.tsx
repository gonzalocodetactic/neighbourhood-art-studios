'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Student = { firstName: string; lastName: string; age: string; grade: string }
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
}
type User = { id: string; firstName: string; lastName: string; email: string; phone: string }

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

function printReceipt(r: Registration, parentName: string) {
  const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const studentRows = r.students.map((s) => `<tr><td style="padding:4px 8px">${s.firstName} ${s.lastName}</td><td style="padding:4px 8px">${s.grade || '—'}</td><td style="padding:4px 8px">${s.age ? `Age ${s.age}` : '—'}</td></tr>`).join('')
  const w = window.open('', '_blank', 'width=680,height=900')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt — ${r.productTitle}</title>
<style>
  body { font-family: -apple-system, sans-serif; color: #111; padding: 48px; max-width: 600px; margin: 0 auto; }
  h1 { color: #3B4BC8; font-size: 22px; margin-bottom: 4px; }
  .sub { color: #888; font-size: 13px; margin-bottom: 32px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 4px 8px; font-size: 12px; color: #666; border-bottom: 1px solid #eee; }
  td { font-size: 14px; }
  .totals td { padding: 4px 8px; font-size: 14px; }
  .totals tr:last-child td { font-weight: 600; border-top: 1px solid #eee; padding-top: 8px; }
  .meta { margin-bottom: 24px; font-size: 14px; line-height: 1.8; }
  @media print { body { padding: 24px; } }
</style></head><body>
<h1>Neighbourhood Art Studios</h1>
<p class="sub">Registration Receipt</p>
<div class="meta">
  <strong>Parent:</strong> ${parentName}<br>
  <strong>Program:</strong> ${r.productTitle}<br>
  <strong>School:</strong> ${r.schoolName}<br>
  <strong>Season:</strong> ${r.seasonName}<br>
  <strong>Order Date:</strong> ${date}<br>
  ${r.monerisOrderId ? `<strong>Order ID:</strong> ${r.monerisOrderId}<br>` : ''}
  <strong>Status:</strong> ${r.paymentStatus.charAt(0).toUpperCase() + r.paymentStatus.slice(1)}
</div>
<table>
  <thead><tr><th>Student</th><th>Grade</th><th>Age</th></tr></thead>
  <tbody>${studentRows}</tbody>
</table>
<br>
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

  // Settings
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [phone, setPhone] = useState(user.phone)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setSettingsMsg(null)
    if (!currentPassword || !newPassword) {
      setSettingsMsg({ type: 'error', text: 'Both password fields are required.' })
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
      } else {
        const data = await res.json().catch(() => ({}))
        setSettingsMsg({ type: 'error', text: data?.error ?? 'Failed to change password.' })
      }
    })
  }

  function handleAddStudentSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (addFirst) params.set('firstName', addFirst)
    if (addLast) params.set('lastName', addLast)
    if (addAge) params.set('age', addAge)
    if (addGrade) params.set('grade', addGrade)
    router.push(`/register?${params.toString()}`)
  }

  const allStudents: Array<Student & { productId: string; productTitle: string; schoolName: string }> = registrations.flatMap((r) =>
    r.students.map((s) => ({ ...s, productId: r.productId, productTitle: r.productTitle, schoolName: r.schoolName })),
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
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="text-sm text-gray-500 hover:text-red-600 transition"
          >
            Sign out
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-white rounded-full p-1 shadow-sm border border-gray-100 w-fit">
          <button className={tabClass('orders')} onClick={() => setTab('orders')}>Order History</button>
          <button className={tabClass('students')} onClick={() => setTab('students')}>My Students</button>
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
                  {registrations.map((r) => (
                    <div key={r.id} className="border border-gray-100 rounded-xl p-4">
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
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <StatusBadge status={r.paymentStatus} />
                          {r.paymentStatus === 'paid' && (
                            <button
                              type="button"
                              onClick={() => printReceipt(r, `${user.firstName} ${user.lastName}`)}
                              className="text-xs text-[#3B4BC8] hover:underline"
                            >
                              Print receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── My Students ────────────────────────────────────────────────── */}
          {tab === 'students' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">My Students</h2>
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
                  {allStudents.map((s, i) => {
                    const params = new URLSearchParams()
                    if (s.productId) params.set('product', s.productId)
                    if (s.firstName) params.set('firstName', s.firstName)
                    if (s.lastName) params.set('lastName', s.lastName)
                    if (s.age) params.set('age', s.age)
                    if (s.grade) params.set('grade', s.grade)
                    return (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[s.age && `Age ${s.age}`, s.grade].filter(Boolean).join(' · ')}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.productTitle}</p>
                        </div>
                        <a
                          href={`/register?${params.toString()}`}
                          className="shrink-0 text-xs text-[#3B4BC8] border border-[#3B4BC8]/30 rounded-lg px-3 py-1.5 hover:bg-[#3B4BC8]/5 transition whitespace-nowrap"
                        >
                          Re-enroll
                        </a>
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
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Settings</h2>
              {settingsMsg && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm ${
                    settingsMsg.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {settingsMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 mb-8">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profile</h3>
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
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#3B4BC8] text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-[#2d3aaa] transition disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : 'Save Profile'}
                </button>
              </form>

              <hr className="border-gray-100 mb-6" />

              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Change Password</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={INPUT} />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-gray-800 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {isPending ? 'Updating…' : 'Change Password'}
                </button>
              </form>
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
              <button
                type="button"
                onClick={() => setShowAddStudent(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
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
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#3B4BC8] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#2d3aaa] transition"
                >
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
