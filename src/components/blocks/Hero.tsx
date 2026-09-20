type MediaDoc = { url?: string; alt?: string }

type HeroBlockProps = {
  title: string
  subtitle?: string
  ctaLabel?: string
  ctaLink?: string
  backgroundImage?: MediaDoc | number | string | null
}

function resolveUrl(val: MediaDoc | number | string | null | undefined): string | null {
  if (!val || typeof val !== 'object') return null
  return (val as MediaDoc).url ?? null
}

export function Hero({ title, subtitle, ctaLabel, ctaLink, backgroundImage }: HeroBlockProps) {
  const imgUrl = resolveUrl(backgroundImage)

  return (
    <section
      className="relative min-h-[62vh] flex items-center overflow-hidden"
      style={
        imgUrl
          ? { backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }
      }
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 px-12 py-16 max-w-2xl">
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight text-white"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-4 text-base text-white/80 leading-relaxed">
            {subtitle}
          </p>
        )}

        {ctaLabel && (
          <a
            href={ctaLink ?? '#'}
            className="mt-8 inline-block px-6 py-2.5 text-sm font-semibold text-white border border-white rounded hover:bg-white hover:text-gray-900 transition-colors"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
