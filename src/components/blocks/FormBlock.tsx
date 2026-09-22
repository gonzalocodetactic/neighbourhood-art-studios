'use client'

import { useState } from 'react'

type FormField = {
  id?: string
  name: string
  label: string
  fieldType: 'text' | 'email' | 'textarea' | 'select'
  required?: boolean
  placeholder?: string
  selectOptions?: { label: string; value: string }[]
}

type FormData = {
  id: number | string
  title: string
  fields?: FormField[]
  submitButtonText?: string
  successMessage?: string
}

type Props = {
  heading?: string
  subheading?: string
  form?: FormData | null
}

export function FormBlock({ heading, subheading, form }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const fields: FormField[] = form?.fields ?? []
  const submitLabel = form?.submitButtonText || 'Send Message'
  const successMessage = form?.successMessage || "Thank you! We'll be in touch soon."

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    // Validate required fields client-side
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) {
        setErrorMsg(`${f.label} is required.`)
        setStatus('idle')
        return
      }
    }

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: form?.id, data: values }),
      })
      if (!res.ok) throw new Error('Server error')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <section className="py-16 px-6 bg-gray-950 text-white">
        {(heading || subheading) && (
          <div className="max-w-2xl mx-auto mb-10 text-center">
            {heading && <h2 className="text-3xl font-bold mb-2">{heading}</h2>}
            {subheading && <p className="text-gray-400">{subheading}</p>}
          </div>
        )}
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-lg text-green-400">{successMessage}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-6 bg-gray-950 text-white">
      {(heading || subheading) && (
        <div className="max-w-2xl mx-auto mb-10 text-center">
          {heading && <h2 className="text-3xl font-bold mb-2">{heading}</h2>}
          {subheading && <p className="text-gray-400">{subheading}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5" noValidate>
        {fields.map((field) => {
          const inputClass =
            'w-full bg-gray-800 border border-gray-700 rounded px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B4BC8] transition-colors'

          return (
            <div key={field.name}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>

              {field.fieldType === 'textarea' ? (
                <textarea
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={5}
                  value={values[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={inputClass}
                />
              ) : field.fieldType === 'select' ? (
                <select
                  name={field.name}
                  required={field.required}
                  value={values[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">{field.placeholder || 'Select…'}</option>
                  {field.selectOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.fieldType}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={values[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={inputClass}
                />
              )}
            </div>
          )
        })}

        {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-[#3B4BC8] hover:bg-[#2d3ba0] disabled:opacity-60 text-white text-sm font-semibold py-3 rounded transition-colors"
        >
          {status === 'submitting' ? 'Sending…' : submitLabel}
        </button>
      </form>
    </section>
  )
}
