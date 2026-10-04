'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { getRegistrationByOrderId, initiateMonerisCheckout, submitCampRegistration, submitRegistration, submitWaitlist, type CampRegistrationInput, type CheckoutAnswer, type RegistrationDetails, type RegistrationInput, type Student, type WaitlistInput } from './actions'

// ── Shared types ──────────────────────────────────────────────────────────────

export type GstSettings = {
  gstEnabled: boolean
  gstRate: number
  gstLabel: string
}

export type RegisterPageData = {
  cities: Array<{ id: number | string; title: string }>
  schools: Array<{ id: number | string; title: string; cityId: number | string }>
  seasons: Array<{ id: number | string; title: string }>
  gstSettings: GstSettings
  termsContent: string
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
    schoolName: string
    seasonName: string
    perStudentFields: Array<{
      label: string
      fieldName: string
      fieldType: 'text' | 'number' | 'select' | 'checkbox'
      required: boolean
      placeholder?: string
      width?: string
      selectOptions?: Array<{ label: string; value: string }>
    }> | null
    checkoutFields: Array<{ label: string; fieldType: string; required: boolean }>
  }>
  campLocations: Array<{ id: number | string; name: string; address?: string; city?: string }>
  campTimeslots: Array<{ id: number | string; label: string }>
  campWeeks: Array<{ id: number | string; label: string; startDate?: string; endDate?: string }>
  campSessions: Array<{
    id: number | string
    productId: number | string
    productTitle: string
    locationId: number | string
    locationName: string
    timeslotId: number | string
    timeslotLabel: string
    campWeekId: number | string
    campWeekLabel: string
    price: number
    capacity: number
    registeredCount: number
    status: string
    checkoutFields: Array<{ label: string; fieldType: string; required: boolean }>
  }>
}

type Variation = RegisterPageData['variations'][number] & {
  isCamp?: boolean
  campSessionId?: number | string
  locationName?: string
  timeslotLabel?: string
  campWeekLabel?: string
}

type CampSession = RegisterPageData['campSessions'][number]

export type SavedStudent = {
  id: string
  firstName: string
  lastName: string
  age: string
  grade: string
  teacherName: string
  divisionNumber: string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  ecFirstName: string
  ecLastName: string
  ecPhone: string
  ecEmail: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(dollars: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(dollars)
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
                className={`px-4 py-3 md:py-2 text-sm cursor-pointer transition-colors ${
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
            className="w-full min-h-11 py-2.5 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all"
          >
            Join Waitlist
          </button>
        ) : (
          <button
            onClick={() => onRegister(variation)}
            className="w-full min-h-11 py-2.5 text-sm font-semibold text-white bg-[#3B4BC8] rounded-lg hover:bg-[#2D3AAA] active:scale-[0.98] transition-all"
          >
            Register Now
          </button>
        )}
      </div>
    </div>
  )
}

// ── Camp program card ──────────────────────────────────────────────────────────

function CampProgramCard({
  session,
  onRegister,
}: {
  session: CampSession
  onRegister: (s: CampSession) => void
}) {
  const spotsLeft = session.capacity - session.registeredCount
  const isFull = spotsLeft <= 0 || session.status === 'closed'
  const isWaitlist = session.status === 'waitlist'
  const pct = Math.min(100, (session.registeredCount / session.capacity) * 100)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            {session.productTitle}
          </h3>
          <p className="text-sm text-gray-600 mb-0.5">{session.timeslotLabel}</p>
          <p className="text-2xl font-bold text-[#3B4BC8] mt-1">{formatPrice(session.price)}</p>
        </div>
        {isFull ? (
          <span className="flex-shrink-0 px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full">FULL</span>
        ) : isWaitlist ? (
          <span className="flex-shrink-0 px-3 py-1 text-xs font-bold text-white bg-amber-500 rounded-full">WAITLIST</span>
        ) : (
          <span className={`flex-shrink-0 text-xs font-semibold ${spotsColor(spotsLeft, session.capacity)}`}>
            {spotsLeft} / {session.capacity} spots
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{session.registeredCount} enrolled</span>
          <span>{session.capacity} capacity</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-[#3B4BC8]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!isFull && !isWaitlist && spotsLeft <= 5 && (
          <p className="mt-1 text-xs font-semibold text-red-500">
            Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left!
          </p>
        )}
      </div>

      <div className="mt-5">
        <button
          onClick={() => onRegister(session)}
          disabled={isFull}
          className={`w-full min-h-11 py-2.5 text-sm font-semibold text-white rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isFull ? 'bg-gray-400' : 'bg-[#3B4BC8] hover:bg-[#2D3AAA]'
          }`}
        >
          {isFull ? 'Session Full' : isWaitlist ? 'Join Waitlist' : 'Register Now'}
        </button>
      </div>
    </div>
  )
}

// ── Registration modal ─────────────────────────────────────────────────────────

const DEFAULT_STUDENT_FIELDS: NonNullable<RegisterPageData['variations'][number]['perStudentFields']> = [
  { label: 'Age', fieldName: 'age', fieldType: 'text', required: false, placeholder: 'e.g. 8', width: '50%' },
  {
    label: 'Gender',
    fieldName: 'gender',
    fieldType: 'select',
    required: false,
    width: '50%',
    selectOptions: [
      { label: 'Male', value: 'Male' },
      { label: 'Female', value: 'Female' },
      { label: 'Rather Not Say', value: 'Rather Not Say' },
    ],
  },
  { label: 'Teacher Name', fieldName: 'teacherName', fieldType: 'text', required: false, placeholder: 'e.g. Ms. Johnson', width: '50%' },
  { label: 'Division', fieldName: 'divisionNumber', fieldType: 'text', required: false, placeholder: 'e.g. Div. 4', width: '50%' },
]

function colSpanClass(width?: string) {
  if (width === '50%') return 'col-span-12 sm:col-span-6'
  if (width === '33%') return 'col-span-12 sm:col-span-4'
  return 'col-span-12'
}

const EMPTY_STUDENT: Record<string, string> = { firstName: '', gender: '' }

function RegistrationModal({
  variation,
  gstSettings,
  termsContent,
  onClose,
  onSuccess,
  initialStudent,
}: {
  variation: Variation
  gstSettings: GstSettings
  termsContent: string
  onClose: () => void
  onSuccess: () => void
  initialStudent?: SavedStudent | null
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Parent fields
  const [parentFirstName, setParentFirstName] = useState('')
  const [parentLastName, setParentLastName]   = useState('')
  const [parentEmail, setParentEmail]         = useState('')
  const [parentPhone, setParentPhone]         = useState('')
  const [ecFirstName, setEcFirstName]         = useState('')
  const [ecLastName, setEcLastName]           = useState('')
  const [ecPhone, setEcPhone]                 = useState('')
  const [ecEmail, setEcEmail]                 = useState('')

  const studentFields = variation.perStudentFields ?? DEFAULT_STUDENT_FIELDS

  // Students — keyed Record so dynamic fields work uniformly
  const [students, setStudents] = useState<Record<string, string>[]>([{ ...EMPTY_STUDENT }])

  useEffect(() => {
    if (!initialStudent) return
    setParentFirstName(initialStudent.parentFirstName)
    setParentLastName(initialStudent.parentLastName)
    setParentEmail(initialStudent.parentEmail)
    setParentPhone(initialStudent.parentPhone)
    setEcFirstName(initialStudent.ecFirstName)
    setEcLastName(initialStudent.ecLastName)
    setEcPhone(initialStudent.ecPhone)
    setEcEmail(initialStudent.ecEmail)
    setStudents([{
      firstName: initialStudent.firstName,
      lastName: initialStudent.lastName,
      age: initialStudent.age,
      grade: initialStudent.grade,
      teacherName: initialStudent.teacherName,
      divisionNumber: initialStudent.divisionNumber,
    }])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamic checkout answers — keyed by field label
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(variation.checkoutFields.map((f) => [f.label, ''])),
  )

  const addStudent = () => setStudents((prev) => [...prev, { ...EMPTY_STUDENT }])
  const removeStudent = (idx: number) => setStudents((prev) => prev.filter((_, i) => i !== idx))
  const updateStudent = (idx: number, field: string, val: string) => {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)))
  }

  // ── Reactive price / GST ──────────────────────────────────────────────────
  const subtotal    = variation.price * students.length
  const gstAmount   = gstSettings.gstEnabled ? Math.round(subtotal * gstSettings.gstRate) / 100 : 0
  const totalAmount = subtotal + gstAmount

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const checkoutAnswers: CheckoutAnswer[] = variation.checkoutFields.map((f) => ({
      fieldLabel: f.label,
      value: answers[f.label] ?? '',
    }))

    const mappedStudents: Student[] = students.map((s) => ({
      firstName: s.firstName,
      ...(s.lastName       ? { lastName: s.lastName }             : {}),
      ...(s.age            ? { age: s.age }                       : {}),
      ...(s.grade          ? { grade: s.grade }                   : {}),
      gender: (s.gender && s.gender !== '') ? s.gender : 'Rather Not Say',
      ...(s.teacherName    ? { teacherName: s.teacherName }       : {}),
      ...(s.divisionNumber ? { divisionNumber: s.divisionNumber } : {}),
    }))

    startTransition(async () => {
      let regId: number | string

      if (variation.isCamp && variation.campSessionId != null) {
        const campInput: CampRegistrationInput = {
          parentFirstName,
          parentLastName,
          parentEmail,
          parentPhone,
          emergencyContactFirstName: ecFirstName || undefined,
          emergencyContactLastName:  ecLastName  || undefined,
          emergencyContactPhone:     ecPhone     || undefined,
          emergencyContactEmail:     ecEmail     || undefined,
          students: mappedStudents,
          productId: variation.productId,
          campSessionId: variation.campSessionId,
          checkoutAnswers,
        }
        const result = await submitCampRegistration(campInput)
        if (!result.success) { setError(result.error); return }
        regId = result.id
      } else {
        const input: RegistrationInput = {
          parentFirstName,
          parentLastName,
          parentEmail,
          parentPhone,
          emergencyContactFirstName: ecFirstName || undefined,
          emergencyContactLastName:  ecLastName  || undefined,
          emergencyContactPhone:     ecPhone     || undefined,
          emergencyContactEmail:     ecEmail     || undefined,
          students: mappedStudents,
          schoolId:  variation.schoolId,
          seasonId:  variation.seasonId,
          productId: variation.productId,
          checkoutAnswers,
        }
        const result = await submitRegistration(input)
        if (!result.success) { setError(result.error); return }
        regId = result.id
      }

      const checkoutResult = await initiateMonerisCheckout(regId)
      if ('checkoutUrl' in checkoutResult) {
        window.location.href = checkoutResult.checkoutUrl
      } else {
        onSuccess()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full md:max-w-lg h-[100dvh] md:h-auto md:max-h-[90vh] overflow-y-auto overscroll-contain bg-white md:rounded-2xl shadow-2xl md:mx-4">
        {/* Header */}
        <div className="sticky top-0 z-[20] bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between md:rounded-t-2xl">
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
            className="w-11 h-11 -mr-2 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 md:px-6 pt-5 space-y-6">
          {/* Parent Info */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Parent / Guardian
              </h3>
              <p className="text-xs text-gray-400">
                Returning parent?{' '}
                <a href="/account/login" className="text-[#3B4BC8] underline">Sign in</a>
                {' '}to manage your registrations.
              </p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  type="text"
                  placeholder="First name *"
                  value={parentFirstName}
                  onChange={(e) => setParentFirstName(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                />
                <input
                  required
                  type="text"
                  placeholder="Last name *"
                  value={parentLastName}
                  onChange={(e) => setParentLastName(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  type="email"
                  placeholder="Email address *"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                />
                <input
                  required
                  type="tel"
                  placeholder="Phone number *"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="First name"
                value={ecFirstName}
                onChange={(e) => setEcFirstName(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <input
                type="text"
                placeholder="Last name"
                value={ecLastName}
                onChange={(e) => setEcLastName(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={ecPhone}
                onChange={(e) => setEcPhone(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
              <input
                type="email"
                placeholder="Email address"
                value={ecEmail}
                onChange={(e) => setEcEmail(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
              />
            </div>
          </section>

          {/* Students */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Student{students.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-3 md:max-h-[55vh] md:overflow-y-auto md:pr-1">
              {students.map((student, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2 relative">
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
                  <input
                    required
                    type="text"
                    placeholder="First name *"
                    value={student.firstName ?? ''}
                    onChange={(e) => updateStudent(idx, 'firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                  />
                  <div className="grid grid-cols-12 gap-3">
                    {studentFields.map((field) => (
                      <div key={field.fieldName} className={colSpanClass(field.width)}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.fieldType === 'select' ? (
                          <select
                            required={field.required}
                            value={student[field.fieldName] ?? ''}
                            onChange={(e) => updateStudent(idx, field.fieldName, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8] bg-white"
                          >
                            <option value="">{field.required ? `Select ${field.label}…` : `${field.label} (optional)`}</option>
                            {field.selectOptions?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : field.fieldType === 'checkbox' ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              required={field.required}
                              checked={student[field.fieldName] === 'true'}
                              onChange={(e) => updateStudent(idx, field.fieldName, e.target.checked ? 'true' : 'false')}
                              className="w-4 h-4 text-[#3B4BC8] rounded border-gray-300 focus:ring-[#3B4BC8]"
                            />
                            <span className="text-sm text-gray-600">Yes</span>
                          </label>
                        ) : (
                          <input
                            type={field.fieldType === 'number' ? 'number' : 'text'}
                            required={field.required}
                            placeholder={field.placeholder ?? ''}
                            value={student[field.fieldName] ?? ''}
                            onChange={(e) => updateStudent(idx, field.fieldName, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3B4BC8]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStudent}
              className="mt-3 min-h-11 text-sm font-medium text-[#3B4BC8] hover:text-[#2D3AAA] transition-colors flex items-center gap-1"
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

          {/* Order Summary */}
          <section className="bg-gray-50 rounded-xl px-4 py-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Order Summary
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {variation.productTitle} {variation.isCamp
                    ? `(${variation.locationName ?? variation.schoolName} – ${variation.campWeekLabel ?? variation.seasonName})`
                    : `(${variation.schoolName} – ${variation.seasonName})`
                  } × {students.length} student{students.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-800">{formatPrice(subtotal)}</span>
              </div>
              {gstSettings.gstEnabled && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{gstSettings.gstLabel}</span>
                  <span className="text-gray-800">{formatPrice(gstAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2 mt-1">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </section>

          {/* Terms & Conditions */}
          <section>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#3B4BC8] border-gray-300 rounded focus:ring-[#3B4BC8]"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the website{' '}
                <button
                  type="button"
                  onClick={() => setTermsOpen((o) => !o)}
                  className="inline-flex items-center min-h-11 md:min-h-0 align-middle text-[#3B4BC8] underline hover:text-[#2D3AAA] font-medium"
                >
                  terms and conditions
                </button>
                {' '}*
              </span>
            </label>
            {termsOpen && (
              <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 border border-gray-200 p-3 rounded text-xs text-slate-700 whitespace-pre-wrap">
                {termsContent || 'Terms and conditions have not been set yet. Please contact us if you have questions.'}
              </div>
            )}
          </section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <p className="text-center font-bold text-sm text-slate-800">
            Pay via cheque or cash via call to (604) 536-7900
          </p>

          {/* Pinned to the bottom of the sheet so the action never scrolls out of view */}
          <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-gray-100">
            <button
              type="submit"
              disabled={isPending || !agreedToTerms}
              className="w-full min-h-12 py-3 text-sm font-bold text-white bg-[#3B4BC8] rounded-xl hover:bg-[#2D3AAA] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {isPending
                ? 'Redirecting to payment…'
                : gstSettings.gstEnabled
                  ? `Proceed to Payment — ${formatPrice(subtotal)} + ${gstSettings.gstRate}% GST (${formatPrice(totalAmount)})`
                  : `Proceed to Payment — ${formatPrice(totalAmount)}`
              }
            </button>
            <p className="mt-2 text-[11px] text-center text-gray-400">
              You'll be redirected to our secure Moneris payment page to complete checkout.
            </p>
          </div>
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
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full md:max-w-lg h-[100dvh] md:h-auto md:max-h-[90vh] overflow-y-auto overscroll-contain bg-white md:rounded-2xl shadow-2xl md:mx-4">
        <div className="sticky top-0 z-[20] bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between md:rounded-t-2xl">
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
            className="w-11 h-11 -mr-2 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 md:px-6 pt-5 space-y-6">
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

          <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-gray-100">
            <button
              type="submit"
              disabled={isPending}
              className="w-full min-h-12 py-3 text-sm font-bold text-white bg-gray-800 rounded-xl hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {isPending ? 'Joining Waitlist…' : 'Join Waitlist'}
            </button>
            <p className="mt-2 text-[11px] text-center text-gray-400">
              We'll notify you by email when a spot becomes available.
            </p>
          </div>
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
  gstSettings,
  termsContent,
  campLocations,
  campTimeslots,
  campWeeks,
  campSessions,
}: RegisterPageData) {
  // in-school flow state
  const [cityId, setCityId] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [seasonId, setSeasonId] = useState('')

  // camp flow state
  const [programType, setProgramType] = useState<'school' | 'camp'>('school')
  const [campProductId, setCampProductId] = useState('')
  const [campLocationId, setCampLocationId] = useState('')
  const [campTimeslotId, setCampTimeslotId] = useState('')
  const [campWeekId, setCampWeekId] = useState('')

  const [modalVariation, setModalVariation] = useState<Variation | null>(null)
  const [waitlistVariation, setWaitlistVariation] = useState<Variation | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)
  const [registrationDetails, setRegistrationDetails] = useState<RegistrationDetails | null>(null)
  const [registrationDetailsLoading, setRegistrationDetailsLoading] = useState(false)

  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get('studentId')
  const [savedStudent, setSavedStudent] = useState<SavedStudent | null>(null)

  useEffect(() => {
    if (!studentIdParam) return
    try {
      const raw = sessionStorage.getItem(`nas_student_${studentIdParam}`)
      if (raw) setSavedStudent(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [studentIdParam])

  // Detect payment=success and fetch order details
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (searchParams.get('payment') === 'success') {
      setRegistrationSuccess(true)
      if (orderId) {
        setRegistrationDetailsLoading(true)
        getRegistrationByOrderId(orderId).then((result) => {
          if (result.success) setRegistrationDetails(result.data)
          setRegistrationDetailsLoading(false)
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Camp derived state ────────────────────────────────────────────────────────
  // One selector button per camp product that has sessions (e.g. Spring / Summer Art Camps)
  const campProducts = [
    ...new Map(campSessions.map((s) => [String(s.productId), s.productTitle])).entries(),
  ]
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title))

  // Only offer the locations / times / weeks the selected camp product actually runs
  const productCampSessions = campSessions.filter((s) => String(s.productId) === campProductId)
  const offered = (key: 'locationId' | 'timeslotId' | 'campWeekId') =>
    new Set(productCampSessions.map((s) => String(s[key])))
  const offeredLocations = offered('locationId')
  const offeredTimeslots = offered('timeslotId')
  const offeredWeeks = offered('campWeekId')
  const productCampLocations = campLocations.filter((l) => offeredLocations.has(String(l.id)))
  const productCampTimeslots = campTimeslots.filter((t) => offeredTimeslots.has(String(t.id)))
  const productCampWeeks = campWeeks.filter((w) => offeredWeeks.has(String(w.id)))
  // Sessions without a timeslot (e.g. Spring camps) skip the time step
  const productHasTimes = productCampTimeslots.length > 0
  const showCampWeeks = productHasTimes ? Boolean(campTimeslotId) : Boolean(campLocationId)

  function selectCampProduct(id: string) {
    setProgramType('camp')
    setCampProductId(id)
    setCampLocationId('')
    setCampTimeslotId('')
    setCampWeekId('')
  }

  const filteredCampSessions = productCampSessions.filter((s) => {
    if (campLocationId && String(s.locationId) !== campLocationId) return false
    if (campTimeslotId && String(s.timeslotId) !== campTimeslotId) return false
    if (campWeekId && String(s.campWeekId) !== campWeekId) return false
    return true
  })

  const campStep = !campLocationId ? 1 : !campTimeslotId ? 2 : !campWeekId ? 3 : 4

  function openCampSession(session: CampSession) {
    const v: Variation = {
      variationKey: `camp-${session.id}`,
      productId: session.productId,
      productTitle: session.productTitle,
      cityId: '',
      schoolId: '',
      seasonId: '',
      price: session.price,
      capacity: session.capacity,
      enrolled: session.registeredCount,
      schoolName: session.locationName,
      seasonName: session.campWeekLabel,
      perStudentFields: null,
      checkoutFields: session.checkoutFields,
      isCamp: true,
      campSessionId: session.id,
      locationName: session.locationName,
      timeslotLabel: session.timeslotLabel,
      campWeekLabel: session.campWeekLabel,
    }
    setModalVariation(v)
  }

  // ── Registration success full-page card ──────────────────────────────────────
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#3B4BC8] px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">
            Neighbourhood Art Studios
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Registration Confirmed!
            </h1>
          </div>
          {registrationDetailsLoading && (
            <p className="mt-3 text-sm text-white/60">Loading your order details…</p>
          )}
          {registrationDetails && !registrationDetailsLoading && (
            <p className="mt-3 text-sm text-white/70 font-mono">
              Order ID: {registrationDetails.monerisOrderId}
            </p>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          {registrationDetailsLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-sm text-gray-400">Loading order details…</p>
            </div>
          ) : registrationDetails ? (
            <>
              {/* Parent */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Parent / Guardian</h2>
                </div>
                <div className="px-5 py-4 space-y-0.5">
                  <p className="text-base font-semibold text-gray-900">
                    {registrationDetails.parentFirstName} {registrationDetails.parentLastName}
                  </p>
                  <p className="text-sm text-gray-600">{registrationDetails.parentEmail}</p>
                  <p className="text-sm text-gray-600">{registrationDetails.parentPhone}</p>
                </div>
              </div>

              {/* Emergency Contact */}
              {(registrationDetails.emergencyContactFirstName || registrationDetails.emergencyContactPhone) && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Emergency Contact</h2>
                  </div>
                  <div className="px-5 py-4 space-y-0.5">
                    {(registrationDetails.emergencyContactFirstName || registrationDetails.emergencyContactLastName) && (
                      <p className="text-base font-semibold text-gray-900">
                        {[registrationDetails.emergencyContactFirstName, registrationDetails.emergencyContactLastName].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {registrationDetails.emergencyContactPhone && (
                      <p className="text-sm text-gray-600">{registrationDetails.emergencyContactPhone}</p>
                    )}
                    {registrationDetails.emergencyContactEmail && (
                      <p className="text-sm text-gray-600">{registrationDetails.emergencyContactEmail}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Students */}
              {registrationDetails.students.map((student, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Student {idx + 1}
                    </h2>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-base font-semibold text-gray-900 mb-2">
                      {student.firstName}{student.lastName ? ` ${student.lastName}` : ''}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {student.age && <span className="text-sm text-gray-600"><span className="font-medium text-gray-700">Age:</span> {student.age}</span>}
                      {student.grade && <span className="text-sm text-gray-600"><span className="font-medium text-gray-700">Grade:</span> {student.grade}</span>}
                      {student.gender && <span className="text-sm text-gray-600"><span className="font-medium text-gray-700">Gender:</span> {student.gender}</span>}
                      {student.teacherName && <span className="text-sm text-gray-600"><span className="font-medium text-gray-700">Teacher:</span> {student.teacherName}</span>}
                      {student.divisionNumber && <span className="text-sm text-gray-600"><span className="font-medium text-gray-700">Division:</span> {student.divisionNumber}</span>}
                    </div>
                    {student.medicalNotes && (
                      <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="font-semibold">Notes:</span> {student.medicalNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Order summary */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Order Summary</h2>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    {registrationDetails.productTitle} · {registrationDetails.schoolName} · {registrationDetails.seasonName}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {registrationDetails.studentCount} student{registrationDetails.studentCount !== 1 ? 's' : ''} × {formatPrice(registrationDetails.unitPrice / 100)}
                      </span>
                      <span className="text-gray-800">{formatPrice(registrationDetails.subtotal / 100)}</span>
                    </div>
                    {registrationDetails.gstAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GST (5%)</span>
                        <span className="text-gray-800">{formatPrice(registrationDetails.gstAmount / 100)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                      <span>Total Paid</span>
                      <span className="text-[#3B4BC8]">{formatPrice(registrationDetails.totalAmount / 100)} CAD</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-base font-semibold text-gray-900 mb-1">Your registration has been submitted!</p>
              <p className="text-sm text-gray-600">We&apos;ll be in touch shortly to confirm your spot.</p>
            </div>
          )}

          {/* CTA */}
          <a
            href="/account"
            className="block w-full py-3 text-center text-sm font-bold text-white bg-[#3B4BC8] rounded-xl hover:bg-[#2D3AAA] active:scale-[0.98] transition-all"
          >
            Go to my registrations →
          </a>
        </div>
      </div>
    )
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
          Choose a program type to see available sessions and register.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

        {/* ── Program type selector ─────────────────────────────────────────── */}
        <div className="mb-10">
          <label className="block text-sm font-bold text-gray-700 mb-3">What type of program are you looking for?</label>
          <div className={`grid grid-cols-2 gap-3 ${campProducts.length > 1 ? 'sm:grid-cols-3' : ''}`}>
            <button
              type="button"
              onClick={() => setProgramType('school')}
              className={`px-4 py-4 rounded-xl border-2 text-left transition-all ${
                programType === 'school'
                  ? 'border-[#3B4BC8] bg-[#3B4BC8]/5'
                  : 'border-gray-200 hover:border-[#3B4BC8]/40'
              }`}
            >
              <p className={`text-sm font-bold ${programType === 'school' ? 'text-[#3B4BC8]' : 'text-gray-700'}`}>
                In-School Art Classes
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Weekday programs at your school</p>
            </button>
            {campProducts.map((p) => {
              const selected = programType === 'camp' && campProductId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectCampProduct(p.id)}
                  className={`px-4 py-4 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? 'border-[#3B4BC8] bg-[#3B4BC8]/5'
                      : 'border-gray-200 hover:border-[#3B4BC8]/40'
                  }`}
                >
                  <p className={`text-sm font-bold ${selected ? 'text-[#3B4BC8]' : 'text-gray-700'}`}>
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Full-day camp sessions</p>
                </button>
              )
            })}
          </div>
        </div>

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

        {savedStudent && (
          <div className="mb-6 p-4 bg-[#3B4BC8]/5 border border-[#3B4BC8]/20 rounded-xl flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#3B4BC8]">
                Re-enrolling {savedStudent.firstName} {savedStudent.lastName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Student info will be pre-filled when you open a program below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSavedStudent(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
              aria-label="Clear"
            >
              ×
            </button>
          </div>
        )}

        {/* ── In-School flow ────────────────────────────────────────────────── */}
        {programType === 'school' && (
          <>
            <StepIndicator active={step} />

            {/* Step 1: City */}
            <div className="mb-7">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">1</span>
                Select your city
              </label>
              <select
                value={cityId}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#3B4BC8] focus:ring-1 focus:ring-[#3B4BC8] appearance-none"
              >
                <option value="">Choose a city…</option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Step 2: School */}
            {cityId && (
              <div className="mb-7 animate-in fade-in duration-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">2</span>
                  Select your school
                  <span className="ml-2 text-xs font-normal text-gray-400">({filteredSchools.length} schools)</span>
                </label>
                <SchoolSearch schools={filteredSchools} value={schoolId} onChange={handleSchoolChange} />
              </div>
            )}

            {/* Step 3: Season */}
            {schoolId && (
              <div className="mb-10 animate-in fade-in duration-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">3</span>
                  Select a season
                </label>
                <div className="flex flex-wrap gap-2">
                  {seasons.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeasonId(String(s.id))}
                      className={`min-h-11 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
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

            {/* Step 4: Programs */}
            {seasonId && (
              <div className="animate-in fade-in duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'Georgia, serif' }}>
                  Available Programs
                </h2>
                {matchingVariations.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <p className="text-gray-500 text-sm">No programs are currently scheduled for this school and season.</p>
                    <p className="text-xs text-gray-400 mt-2">Check back soon or contact us to be notified when registration opens.</p>
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
          </>
        )}

        {/* ── Camp flow ─────────────────────────────────────────────────────── */}
        {programType === 'camp' && (
          <>
            {/* Location */}
            <div className="mb-7">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">1</span>
                Select a location
              </label>
              <div className="flex flex-wrap gap-2">
                {productCampLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => { setCampLocationId(String(loc.id)); setCampTimeslotId(''); setCampWeekId('') }}
                    className={`min-h-11 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      String(loc.id) === campLocationId
                        ? 'border-[#3B4BC8] bg-[#3B4BC8] text-white'
                        : 'border-gray-300 text-gray-600 hover:border-[#3B4BC8] hover:text-[#3B4BC8]'
                    }`}
                  >
                    {loc.name}{loc.city ? ` · ${loc.city}` : ''}
                  </button>
                ))}
                {productCampLocations.length === 0 && (
                  <p className="text-sm text-gray-400">No camp locations available yet.</p>
                )}
              </div>
            </div>

            {/* Timeslot */}
            {campLocationId && productHasTimes && (
              <div className="mb-7 animate-in fade-in duration-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">2</span>
                  Select a time
                </label>
                <div className="flex flex-wrap gap-2">
                  {productCampTimeslots.map((ts) => (
                    <button
                      key={ts.id}
                      type="button"
                      onClick={() => { setCampTimeslotId(String(ts.id)); setCampWeekId('') }}
                      className={`min-h-11 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        String(ts.id) === campTimeslotId
                          ? 'border-[#3B4BC8] bg-[#3B4BC8] text-white'
                          : 'border-gray-300 text-gray-600 hover:border-[#3B4BC8] hover:text-[#3B4BC8]'
                      }`}
                    >
                      {ts.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Week */}
            {showCampWeeks && (
              <div className="mb-10 animate-in fade-in duration-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3B4BC8] text-white text-[10px] font-bold mr-2">{productHasTimes ? 3 : 2}</span>
                  Select a week
                </label>
                <div className="flex flex-wrap gap-2">
                  {productCampWeeks.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setCampWeekId(String(w.id))}
                      className={`min-h-11 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        String(w.id) === campWeekId
                          ? 'border-[#3B4BC8] bg-[#3B4BC8] text-white'
                          : 'border-gray-300 text-gray-600 hover:border-[#3B4BC8] hover:text-[#3B4BC8]'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sessions grid */}
            {campWeekId && (
              <div className="animate-in fade-in duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'Georgia, serif' }}>
                  Available Camp Sessions
                </h2>
                {filteredCampSessions.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <p className="text-gray-500 text-sm">No sessions available for this combination.</p>
                    <p className="text-xs text-gray-400 mt-2">Try a different location, time, or week.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredCampSessions.map((s) => (
                      <CampProgramCard key={s.id} session={s} onRegister={openCampSession} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Registration modal */}
      {modalVariation && (
        <RegistrationModal
          variation={modalVariation}
          gstSettings={gstSettings}
          termsContent={termsContent}
          onClose={() => setModalVariation(null)}
          onSuccess={() => {
            setModalVariation(null)
            setRegistrationSuccess(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          initialStudent={savedStudent}
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
