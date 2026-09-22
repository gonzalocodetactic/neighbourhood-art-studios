'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMediaUrl, getMediaAlt } from '@/utilities/getMediaUrl'

type MediaDoc = { url?: string; alt?: string }
type GalleryImage = { id?: string; image?: MediaDoc | number | string | null; caption?: string | null }

type Props = {
  title?: string | null
  images?: GalleryImage[]
}

export function LightboxGalleryBlock({ title, images = [] }: Props) {
  const [idx, setIdx] = useState<number | null>(null)

  const close = useCallback(() => setIdx(null), [])
  const prev = useCallback(() => setIdx(i => (i !== null ? Math.max(0, i - 1) : null)), [])
  const next = useCallback(() => setIdx(i => (i !== null ? Math.min(images.length - 1, i + 1) : null)), [images.length])

  useEffect(() => {
    if (idx === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, close, next, prev])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = idx !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [idx])

  const active = idx !== null ? images[idx] : null
  const activeUrl = active ? getMediaUrl(active.image) : null

  return (
    <section className="py-12 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {title}
          </h2>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((item, i) => {
            const url = getMediaUrl(item.image)
            const alt = getMediaAlt(item.image)
            return (
              <button
                key={item.id ?? i}
                type="button"
                onClick={() => setIdx(i)}
                className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-200 group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#3B4BC8] focus:ring-offset-2"
                aria-label={item.caption || alt || `Gallery image ${i + 1}`}
              >
                {url ? (
                  <img
                    src={url}
                    alt={alt || item.caption || ''}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lightbox overlay */}
      {idx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92"
          onClick={close}
          role="dialog"
          aria-modal
          aria-label="Image lightbox"
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-5 text-white/80 hover:text-white text-4xl leading-none font-light transition-colors"
            aria-label="Close"
          >
            ×
          </button>

          {/* Counter */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-widest">
            {idx + 1} / {images.length}
          </span>

          {/* Prev */}
          {idx > 0 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-4 text-white/70 hover:text-white text-5xl font-light leading-none transition-colors select-none"
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={activeUrl ?? ''}
            alt={active ? (getMediaAlt(active.image) || active.caption || '') : ''}
            className="max-h-[88vh] max-w-[88vw] object-contain rounded shadow-2xl"
            onClick={e => e.stopPropagation()}
            draggable={false}
          />

          {/* Next */}
          {idx < images.length - 1 && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 text-white/70 hover:text-white text-5xl font-light leading-none transition-colors select-none"
              aria-label="Next image"
            >
              ›
            </button>
          )}

          {/* Caption */}
          {active?.caption && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center max-w-lg">
              {active.caption}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
