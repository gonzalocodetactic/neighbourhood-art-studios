import { getMediaUrl } from '@/utilities/getMediaUrl'

type FooterCtaProps = {
  backgroundImage?: { url?: string; alt?: string } | number | string | null
  topTagline?: string | null
  headline: string
  primaryCtaLabel?: string | null
  primaryCtaLink?: string | null
}

export function FooterCta({
  backgroundImage,
  topTagline,
  headline,
  primaryCtaLabel,
  primaryCtaLink,
}: FooterCtaProps) {
  const imgUrl = getMediaUrl(backgroundImage)

  return (
    <section
      className="relative min-h-[56vh] flex items-center justify-center text-center overflow-hidden"
      style={
        imgUrl
          ? { backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)' }
      }
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 px-12 py-16 max-w-2xl mx-auto">
        {topTagline && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/60">
            {topTagline}
          </p>
        )}

        <h2
          className="text-3xl md:text-5xl font-bold text-white leading-tight"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {headline}
        </h2>

        {primaryCtaLabel && (
          <a
            href={primaryCtaLink ?? '#'}
            className="mt-10 inline-block px-8 py-3 text-sm font-semibold text-white border border-white/70 rounded hover:bg-[#3B4BC8] hover:border-[#3B4BC8] transition-colors"
          >
            {primaryCtaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
