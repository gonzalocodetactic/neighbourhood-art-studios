'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Student = { firstName: string; lastName: string; age: string; grade: string }
type Registration = {
  id: string
  productTitle: string
  schoolName: string
  seasonName: string
  studentCount: number
  totalAmount: number
  paymentStatus: string
  attendanceStatus: string
  createdAt: string
  students: Student[]
}
type User = { id: string; firstName: string; lastName: string; email: string; phone: string }

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

  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [phone, setPhone] = useState(user.phone)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const allStudents: Array<Student & { registration: string }> = registrations.flatMap((r) =>
    r.students.map((s) => ({ ...s, registration: r.productTitle })),
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
                        <div>
                          <p className="font-medium text-gray-800">{r.productTitle}</p>
                          <p className="text-xs text-gray-500">{r.schoolName} · {r.seasonName}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {r.studentCount} student{r.studentCount !== 1 ? 's' : ''} · {formatCents(r.totalAmount)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge status={r.paymentStatus} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'students' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">My Students</h2>
              {allStudents.length === 0 ? (
                <p className="text-sm text-gray-500">No students registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {allStudents.map((s, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <p className="font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[s.age && `Age ${s.age}`, s.grade].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.registration}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
                  />
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
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4BC8]/30"
                  />
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
    </main>
  )
}
