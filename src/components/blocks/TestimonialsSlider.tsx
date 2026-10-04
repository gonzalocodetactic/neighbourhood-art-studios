'use client'

import { useState } from 'react'

type Testimonial = {
  id?: string
  quote: string
  clientName: string
  clientSubtext?: string | null
}

type TestimonialsSliderProps = {
  subtitle?: string | null
  title: string
  testimonials?: Testimonial[]
}

export function TestimonialsSlider({ subtitle, title, testimonials = [] }: TestimonialsSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = testimonials.length

  if (total === 0) return null

  const prev = () => setCurrent((c) => (c - 1 + total) % total)
  const next = () => setCurrent((c) => (c + 1) % total)

  const { quote, clientName, clientSubtext } = testimonials[current]

  return (
    <section className="py-12 md:py-20 px-4 md:px-12 bg-white">
      {/* Heading */}
      <div className="text-center mb-10">
        {subtitle && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            {subtitle}
          </p>
        )}
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {title}
        </h2>
        <div className="mx-auto mt-4 w-12 h-0.5 bg-[#3B4BC8]" />
      </div>

      {/* Slide */}
      <div className="relative max-w-3xl mx-auto flex items-center gap-6">
        {/* Prev */}
        <button
          onClick={prev}
          aria-label="Previous testimonial"
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-xl"
        >
          ‹
        </button>

        <div className="flex-1 text-center">
          <blockquote>
            <p
              className="testimonial-quote text-base md:text-lg text-gray-700 leading-relaxed italic"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {quote}
            </p>
          </blockquote>

          <div className="mt-6">
            <p className="text-sm font-bold text-gray-900">{clientName}</p>
            {clientSubtext && (
              <p className="text-xs text-gray-500 mt-1">{clientSubtext}</p>
            )}
          </div>
        </div>

        {/* Next */}
        <button
          onClick={next}
          aria-label="Next testimonial"
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors text-xl"
        >
          ›
        </button>
      </div>

      {/* Counter */}
      <div className="mt-8 text-center text-xs text-gray-400 tracking-widest">
        {current + 1} / {total}
      </div>
    </section>
  )
}
