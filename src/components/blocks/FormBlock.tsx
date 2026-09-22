'use client'

import { useState } from 'react'

type FormField = {
  id?: string
  name: string
  label: string
  fieldType: 'text' | 'email' | 'date' | 'textarea' | 'select' | 'checkboxGroup' | 'radio'
  required?: boolean
  placeholder?: string
  maxSelections?: number | null
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
    setValues(prev => ({ ...prev, [name]: value }))
  }

  function toggleCheckbox(name: string, value: string, max?: number | null) {
    setValues(prev => {
      const current = prev[name] ? prev[name].split(',').filter(Boolean) : []
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter(v => v !== value).join(',') }
      }
      if (max && current.length >= max) return prev
      return { ...prev, [name]: [...current, value].join(',') }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

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

  const inputClass =
    'w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition'

  if (status === 'success') {
    return (
      <section className="py-16 px-6 bg-gray-50">
        {(heading || subheading) && (
          <div className="max-w-2xl mx-auto mb-10 text-center">
            {heading && <h2 className="text-3xl font-bold text-gray-900 mb-2">{heading}</h2>}
            {subheading && <p className="text-gray-500">{subheading}</p>}
          </div>
        )}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-lg text-green-600 font-medium">{successMessage}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-6 bg-gray-50">
      {(heading || subheading) && (
        <div className="max-w-2xl mx-auto mb-8 text-center">
          {heading && (
            <h2
              className="text-3xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {heading}
            </h2>
          )}
          {subheading && <p className="text-gray-500">{subheading}</p>}
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {fields.map(field => {
            const labelEl = (
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
            )

            if (field.fieldType === 'textarea') {
              return (
                <div key={field.name}>
                  {labelEl}
                  <textarea
                    name={field.name}
                    placeholder={field.placeholder}
                    rows={5}
                    value={values[field.name] ?? ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    className={inputClass}
                  />
                </div>
              )
            }

            if (field.fieldType === 'select') {
              return (
                <div key={field.name}>
                  {labelEl}
                  <select
                    name={field.name}
                    value={values[field.name] ?? ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">{field.placeholder || 'Select…'}</option>
                    {field.selectOptions?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )
            }

            if (field.fieldType === 'checkboxGroup') {
              const selected = values[field.name] ? values[field.name].split(',').filter(Boolean) : []
              const max = field.maxSelections
              return (
                <div key={field.name}>
                  {labelEl}
                  {max && <p className="text-[11px] text-gray-400 mb-2">Select up to {max}</p>}
                  <div className="space-y-2">
                    {field.selectOptions?.map(opt => {
                      const checked = selected.includes(opt.value)
                      const disabled = !checked && !!max && selected.length >= max
                      return (
                        <label key={opt.value} className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-40' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleCheckbox(field.name, opt.value, max)}
                            className="w-4 h-4 rounded border-gray-300 text-[#3B82F6] focus:ring-[#3B82F6]"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            }

            if (field.fieldType === 'radio') {
              return (
                <div key={field.name}>
                  {labelEl}
                  <div className="flex flex-wrap gap-4 mt-1">
                    {field.selectOptions?.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.name}
                          value={opt.value}
                          checked={values[field.name] === opt.value}
                          onChange={() => handleChange(field.name, opt.value)}
                          className="w-4 h-4 border-gray-300 text-[#3B82F6] focus:ring-[#3B82F6]"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            }

            // text, email, date
            return (
              <div key={field.name}>
                {labelEl}
                <input
                  type={field.fieldType}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  className={inputClass}
                />
              </div>
            )
          })}

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-[#3B82F6] hover:bg-[#2563eb] disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-lg transition-colors"
          >
            {status === 'submitting' ? 'Sending…' : submitLabel}
          </button>
        </form>
      </div>
    </section>
  )
}
