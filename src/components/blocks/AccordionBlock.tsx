'use client'

import { useState } from 'react'

type AccordionItem = {
  id?: string
  heading: string
  content: string
  defaultOpen?: boolean
}

type Props = {
  title?: string | null
  items?: AccordionItem[]
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function AccordionBlock({ title, items = [] }: Props) {
  const [openIds, setOpenIds] = useState<Set<number>>(
    () => new Set(items.flatMap((item, i) => item.defaultOpen ? [i] : [])),
  )

  function toggle(i: number) {
    setOpenIds(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <section className="py-14 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        {title && (
          <h2
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {title}
          </h2>
        )}
        <div className="space-y-2">
          {items.map((item, i) => {
            const open = openIds.has(i)
            return (
              <div key={item.id ?? i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800">{item.heading}</span>
                  <ChevronIcon open={open} />
                </button>
                {open && (
                  <div className="px-5 pb-5 pt-1 bg-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.content}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
