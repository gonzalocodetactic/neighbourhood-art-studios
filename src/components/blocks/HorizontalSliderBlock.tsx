'use client'

type MediaDoc = { url?: string; alt?: string }
type Slide = {
  id?: string
  image?: MediaDoc | number | string | null
  caption?: string | null
}

type Props = {
  slides?: Slide[]
  speed?: number | null
  imageHeight?: number | null
}

function resolveUrl(val: MediaDoc | number | string | null | undefined): string | null {
  if (!val || typeof val !== 'object') return null
  return (val as MediaDoc).url ?? null
}
function resolveAlt(val: MediaDoc | number | string | null | undefined): string {
  if (!val || typeof val !== 'object') return ''
  return (val as MediaDoc).alt ?? ''
}

export function HorizontalSliderBlock({ slides = [], speed = 30, imageHeight = 320 }: Props) {
  if (!slides.length) return null

  const duration = `${speed ?? 30}s`
  const height = imageHeight ?? 320

  // Duplicate slides for seamless loop
  const track = [...slides, ...slides]

  return (
    <div className="w-full overflow-hidden bg-black" style={{ height }}>
      <div
        className="slider-track h-full"
        style={{ animationDuration: duration }}
      >
        {track.map((slide, i) => {
          const url = resolveUrl(slide.image)
          const alt = resolveAlt(slide.image)
          return (
            <div
              key={`${slide.id ?? i}-${i}`}
              className="relative flex-shrink-0 h-full"
              style={{ width: Math.round(height * 1.4) }}
            >
              {url ? (
                <img
                  src={url}
                  alt={alt || slide.caption || ''}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gray-800" />
              )}
              {slide.caption && (
                <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-white/70 bg-black/30 py-0.5">
                  {slide.caption}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
