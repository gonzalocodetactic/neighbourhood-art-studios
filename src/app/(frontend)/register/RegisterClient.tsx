'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { submitRegistration, submitWaitlist, type CheckoutAnswer, type RegistrationInput, type Student, type WaitlistInput } from './actions'

// ── Shared types ──────────────────────────────────────────────────────────────

export type RegisterPageData = {
  cities: Array<{ id: number | string; title: string }>
  schools: Array<{ id: number | string; title: string; cityId: number | string }>
  seasons: Array<{ id: number | string; title: string }>
  variations: Array<{
    variationKey: string
    productId: number | string
    productTitle: string
    cityId: number | string
    schoolId: number | string
    seasonId: number | string
    price: number
    capacity: number
    enrolled: number
    dayOfWeek?: string
    timeSlot?: string
    checkoutFields: Array<{ label: string; fieldType: string; required: boolean }>
  }>
}

type Variation = RegisterPageData['variations'][number]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

function spotsColor(left: number, capacity: number) {
  const ratio = left / capacity
  if (left === 0) return 'text-red-600'
  if (ratio <= 0.25) return 'text-red-500'
  if (ratio <= 0.5) return 'text-amber-500'
  return 'text-green-600'
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = ['City', 'School', 'Season', 'Program']

function StepIndicator({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const idx = i + 1
        const done = idx < active
        const current = idx === active
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  done
                    ? 'bg-[#3B4BC8] border-[#3B4BC8] text-white'
                    : current
                      ? 'border-[#3B4BC8] text-[#3B4BC8] bg-white'
                      : 'border-gray-300 text-gray-400 bg-white'
                }`}
              >
                {done ? '✓' : idx}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                  current ? 'text-[#3B4BC8]' : done ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-1 mb-5 transition-colors ${
                  done ? 'bg-[#3B4BC8]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── School search combobox ─────────────────────────────────────────────────────

function SchoolSearch({
  schools,
  value,
  onChange,
}: {
  schools: RegisterPageData['schools']
  value: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState(value ? (schools.find((s) => String(s.id) === value)?.title ?? '') : '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length >= 1
    ? schools.filter((s) => s.title.toLowerCase().includes(query.toLowerCase())).slice(0, 60)
    : schools.slice(0, 60)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keep display text in sync when parent resets value
  useEffect(() => {
    if (!value) setQuery('')
  }, [value])

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (!e.target.value) onChange('')
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type to search schools…"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8] focus:ring-1 focus:ring-[#3B4BC8] bg-white"
      />
      {open && (
        <ul className="absolute z-30 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400">No schools match "{query}"</li>
          ) : (
            filtered.map((s) => (
              <li
                key={s.id}
                onMouseDown={() => {
                  onChange(String(s.id))
                  setQuery(s.title)
                  setOpen(false)
                }}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                  String(s.id) === value
                    ? 'bg-[#3B4BC8]/10 text-[#3B4BC8] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {s.title}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

// ── Program card ──────────────────────────────────────────────────────────────

function ProgramCard({
  variation,
  onRegister,
  onWaitlist,
}: {
  variation: Variation
  onRegister: (v: Variation) => void
  onWaitlist: (v: Variation) => void
}) {
  const spotsLeft = variation.capacity - variation.enrolled
  const isFull = spotsLeft <= 0
  const pct = Math.min(100, (variation.enrolled / variation.capacity) * 100)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3
            className="text-lg font-bold text-gray-900 mb-1"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {variation.productTitle}
          </h3>
          <p className="text-2xl font-bold text-[#3B4BC8]">{formatPrice(variation.price)}</p>
        </div>
        {isFull ? (
          <span className="flex-shrink-0 px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
            FULL
          </span>
        ) : (
          <span
            className={`flex-shrink-0 text-xs font-semibold ${spotsColor(spotsLeft, variation.capacity)}`}
          >
            {spotsLeft} / {variation.capacity} spots
          </span>
        )}
      </div>

      {(variation.dayOfWeek || variation.timeSlot) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {variation.dayOfWeek && (
            <span className="px-2 py-1 text-xs font-medium text-[#3B4BC8] bg-[#3B4BC8]/10 rounded-full">
              {variation.dayOfWeek}
            </span>
          )}
          {variation.timeSlot && (
            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
              {variation.timeSlot}
            </span>
          )}
        </div>
      )}

      {/* Capacity bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{variation.enrolled} enrolled</span>
          <span>{variation.capacity} capacity</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isFull ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-[#3B4BC8]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!isFull && spotsLeft <= 5 && (
          <p className="mt-1 text-xs font-semibold text-red-500">
            Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left — register soon!
          </p>
        )}
      </div>

      <div className="mt-5">
        {isFull ? (
          <button
            onClick={() => onWaitlist(variation)}
            className="w-full py-2.5 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all"
          >
            Join Waitlist
          </button>
        ) : (
          <button
            onClick={() => onRegister(variation)}
            className="w-full py-2.5 text-sm font-semibold text-white bg-[#3B4BC8] rounded-lg hover:bg-[#2D3AAA] active:scale-[0.98] transition-all"
          >
            Register Now
          </button>
        )}
      </div>
    </div>
  )
}

// ── Registration modal ─────────────────────────────────────────────────────────

const EMPTY_STUDENT: Student = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  grade: '',
  medicalNotes: '',
}

function RegistrationModal({
  variation,
  onClose,
  onSuccess,
}: {
  variation: Variation
  onClose: () => void
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Parent fields
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')

  // Students
  const [students, setStudents] = useState<Student[]>([{ ...EMPTY_STUDENT }])

  // Dynamic checkout answers — keyed by field label
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(variation.checkoutFields.map((f) => [f.label, ''])),
  )

  const addStudent = () => setStudents((prev) => [...prev, { ...EMPTY_STUDENT }])
  const removeStudent = (idx: number) => setStudents((prev) => prev.filter((_, i) => i !== idx))
  const updateStudent = (idx: number, field: keyof Student, val: string) => {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const checkoutAnswers: CheckoutAnswer[] = variation.checkoutFields.map((f) => ({
      fieldLabel: f.label,
      value: answers[f.label] ?? '',
    }))

    const payload: RegistrationInput = {
      parentName,
      parentEmail,
      parentPhone,
      students: students.map((s) => ({
        firstName: s.firstName,
        lastName: s.lastName,
        ...(s.dateOfBirth ? { dateOfBirth: s.dateOfBirth } : {}),
        ...(s.grade ? { grade: s.grade } : {}),
        ...(s.medicalNotes ? { medicalNotes: s.medicalNotes } : {}),
      })),
      schoolId: variation.schoolId,
      seasonId: variation.seasonId,
      productId: variation.productId,
      checkoutAnswers,
    }

    startTransition(async () => {
      const result = await submitRegistration(payload)
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Register
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {variation.productTitle} · {formatPrice(variation.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Parent Info */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Parent / Guardian
            </h3>
            <div className="space-y-3">
              <input
                required
                type="text"
                placeholder="Full name *"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <input
                required
                type="email"
                placeholder="Email address *"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <input
                required
                type="tel"
                placeholder="Phone number *"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
            </div>
          </section>

          {/* Students */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Student{students.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-4">
              {students.map((student, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
                  {students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudent(idx)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xs transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs font-semibold text-gray-500">
                    Student {idx + 1}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      type="text"
                      placeholder="First name *"
                      value={student.firstName}
                      onChange={(e) => updateStudent(idx, 'firstName', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                    />
                    <input
                      required
                      type="text"
                      placeholder="Last name *"
                      value={student.lastName}
                      onChange={(e) => updateStudent(idx, 'lastName', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Date of birth</label>
                      <input
                        type="date"
                        value={student.dateOfBirth}
                        onChange={(e) => updateStudent(idx, 'dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Grade (e.g. Grade 3)"
                      value={student.grade}
                      onChange={(e) => updateStudent(idx, 'grade', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8] self-end"
                    />
                  </div>
                  <textarea
                    placeholder="Allergies, medications, or other notes…"
                    value={student.medicalNotes}
                    onChange={(e) => updateStudent(idx, 'medicalNotes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8] resize-none"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStudent}
              className="mt-3 text-sm font-medium text-[#3B4BC8] hover:text-[#2D3AAA] transition-colors flex items-center gap-1"
            >
              <span className="text-lg leading-none">+</span> Add another student
            </button>
          </section>

          {/* Dynamic checkout fields */}
          {variation.checkoutFields.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Additional Information
              </h3>
              <div className="space-y-3">
                {variation.checkoutFields.map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.fieldType === 'textarea' ? (
                      <textarea
                        required={field.required}
                        value={answers[field.label] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [field.label]: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8] resize-none"
                      />
                    ) : field.fieldType === 'checkbox' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          required={field.required}
                          checked={answers[field.label] === 'true'}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [field.label]: e.target.checked ? 'true' : 'false',
                            }))
                          }
                          className="w-4 h-4 text-[#3B4BC8] rounded border-gray-300 focus:ring-[#3B4BC8]"
                        />
                        <span className="text-sm text-gray-600">Yes</span>
                      </label>
                    ) : (
                      <input
                        type="text"
                        required={field.required}
                        value={answers[field.label] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [field.label]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 text-sm font-bold text-white bg-[#3B4BC8] rounded-xl hover:bg-[#2D3AAA] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            {isPending ? 'Submitting…' : `Confirm Registration · ${formatPrice(variation.price)}`}
          </button>

          <p className="text-[11px] text-center text-gray-400">
            Payment will be collected separately. Spots are reserved upon form submission.
          </p>
        </form>
      </div>
    </div>
  )
}

// ── Waitlist modal ────────────────────────────────────────────────────────────

function WaitlistModal({
  variation,
  onClose,
  onSuccess,
}: {
  variation: Variation
  onClose: () => void
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentFirstName, setStudentFirstName] = useState('')
  const [studentLastName, setStudentLastName] = useState('')
  const [grade, setGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const input: WaitlistInput = {
      parentName,
      parentEmail,
      parentPhone,
      studentFirstName,
      studentLastName,
      grade,
      notes: notes || undefined,
      schoolId: variation.schoolId,
      seasonId: variation.seasonId,
      productId: variation.productId,
    }

    startTransition(async () => {
      const result = await submitWaitlist(input)
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onSuccess} />
        <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl mx-4 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            You&apos;re on the list!
          </h2>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold text-gray-900">
              {studentFirstName} {studentLastName}
            </span>{' '}
            has been added to the waitlist for
          </p>
          <p className="text-sm font-semibold text-[#3B4BC8] mb-4">
            {variation.productTitle}
          </p>
          <p className="text-xs text-gray-400 mb-7">
            We&apos;ll reach out to{' '}
            <span className="font-medium text-gray-600">{parentEmail}</span> as
            soon as a spot opens up.
          </p>
          <button
            onClick={onSuccess}
            className="w-full py-2.5 text-sm font-bold text-white bg-[#3B4BC8] rounded-xl hover:bg-[#2D3AAA] active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl mx-4">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              Join Waitlist
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {variation.productTitle} · We'll contact you when a spot opens
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Parent / Guardian
            </h3>
            <div className="space-y-3">
              <input
                required
                type="text"
                placeholder="Full name *"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <input
                required
                type="email"
                placeholder="Email address *"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <input
                required
                type="tel"
                placeholder="Phone number *"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Student
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  type="text"
                  placeholder="First name *"
                  value={studentFirstName}
                  onChange={(e) => setStudentFirstName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                />
                <input
                  required
                  type="text"
                  placeholder="Last name *"
                  value={studentLastName}
                  onChange={(e) => setStudentLastName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                />
              </div>
              <input
                required
                type="text"
                placeholder="Grade (e.g. Grade 3) *"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <textarea
                placeholder="Any notes (allergies, special requirements…)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8] resize-none"
              />
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 text-sm font-bold text-white bg-gray-800 rounded-xl hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            {isPending ? 'Joining Waitlist…' : 'Join Waitlist'}
          </button>

          <p className="text-[11px] text-center text-gray-400">
            We'll notify you by email when a spot becomes available.
          </p>
        </form>
      </div>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export default function RegisterClient({
  cities,
  schools,
  seasons,
  variations,
}: RegisterPageData) {
  const [cityId, setCityId] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [modalVariation, setModalVariation] = useState<Variation | null>(null)
  const [waitlistVariation, setWaitlistVariation] = useState<Variation | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)

  const filteredSchools = schools.filter((s) => String(s.cityId) === cityId)

  const matchingVariations = variations.filter(
    (v) =>
      String(v.cityId) === cityId &&
      String(v.schoolId) === schoolId &&
      String(v.seasonId) === seasonId,
  )

  const step = !cityId ? 1 : !schoolId ? 2 : !seasonId ? 3 : 4

  function handleCityChange(id: string) {
    setCityId(id)
    setSchoolId('')
    setSeasonId('')
  }
  function handleSchoolChange(id: string) {
    setSchoolId(id)
    const fall2026 = seasons.find((s) => s.title === 'Fall 2026')
    setSeasonId(fall2026 ? String(fall2026.id) : '')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-[#3B4BC8] px-8 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
          Neighbourhood Art Studios
        </p>
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Register for a Program
        </h1>
        <p className="mt-2 text-sm text-white/75">
          Select your city, school, and season to see available programs and register.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Step tracker */}
        <StepIndicator active={step} />

        {/* Registration success banner */}
        {registrationSuccess && (
          <div className="mb-8 p-5 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-base font-bold text-green-800">Registration Submitted!</p>
            <p className="text-sm text-green-700 mt-1">
              We'll be in touch shortly to confirm your spot and arrange payment.
            </p>
            <button
              onClick={() => {
                setRegistrationSuccess(false)
                setCityId('')
                setSchoolId('')
                setSeasonId('')
              }}
              className="mt-4 text-sm font-semibold text-green-700 underline hover:text-green-900"
            >
              Register another student
            </button>
          </div>
        )}

        {/* Waitlist success banner */}
        {waitlistSuccess && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-base font-bold text-amber-800">Added to Waitlist!</p>
            <p className="text-sm text-amber-700 mt-1">
              We'll contact you as soon as a spot opens up.
            </p>
            <button
              onClick={() => {
                setWaitlistSuccess(false)
                setCityId('')
                setSchoolId('')
                setSeasonId('')
              }}
              className="mt-4 text-sm font-semibold text-amber-700 underline hover:text-amber-900"
            >
              Back to programs
            </button>
          </div>
        )}

        {/* ── Step 1: City ─────────────────────────────────────────────────── */}
        <div className="mb-7">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">
              1
            </span>
            Select your city
          </label>
          <select
            value={cityId}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#3B4BC8] focus:ring-1 focus:ring-[#3B4BC8] appearance-none"
          >
            <option value="">Choose a city…</option>
            {cities.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* ── Step 2: School ───────────────────────────────────────────────── */}
        {cityId && (
          <div className="mb-7 animate-in fade-in duration-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">
                2
              </span>
              Select your school
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({filteredSchools.length} schools)
              </span>
            </label>
            <SchoolSearch
              schools={filteredSchools}
              value={schoolId}
              onChange={handleSchoolChange}
            />
          </div>
        )}

        {/* ── Step 3: Season ───────────────────────────────────────────────── */}
        {schoolId && (
          <div className="mb-10 animate-in fade-in duration-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">
                3
              </span>
              Select a season
            </label>
            <div className="flex flex-wrap gap-2">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeasonId(String(s.id))}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    String(s.id) === seasonId
                      ? 'border-[#3B4BC8] bg-[#3B4BC8] text-white'
                      : 'border-gray-300 text-gray-600 hover:border-[#3B4BC8] hover:text-[#3B4BC8]'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Programs ─────────────────────────────────────────────── */}
        {seasonId && (
          <div className="animate-in fade-in duration-200">
            <h2
              className="text-xl font-bold text-gray-900 mb-5"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Available Programs
            </h2>

            {matchingVariations.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">
                  No programs are currently scheduled for this school and season.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Check back soon or contact us to be notified when registration opens.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {matchingVariations.map((v) => (
                  <ProgramCard key={v.variationKey} variation={v} onRegister={setModalVariation} onWaitlist={setWaitlistVariation} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Registration modal */}
      {modalVariation && (
        <RegistrationModal
          variation={modalVariation}
          onClose={() => setModalVariation(null)}
          onSuccess={() => {
            setModalVariation(null)
            setRegistrationSuccess(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {/* Waitlist modal */}
      {waitlistVariation && (
        <WaitlistModal
          variation={waitlistVariation}
          onClose={() => setWaitlistVariation(null)}
          onSuccess={() => {
            setWaitlistVariation(null)
            setWaitlistSuccess(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}
    </div>
  )
}
