type HighlightCalloutProps = {
  backgroundColor?: string | null
  text: string
  ctaLabel?: string | null
  ctaLink?: string | null
}

export function HighlightCallout({
  backgroundColor = '#3B4BC8',
  text,
  ctaLabel,
  ctaLink,
}: HighlightCalloutProps) {
  return (
    <section
      className="flex items-center justify-between gap-8 px-12 py-8"
      style={{ backgroundColor: backgroundColor ?? '#3B4BC8' }}
    >
      <p className="text-white text-base md:text-lg font-medium leading-snug max-w-xl">
        {text}
      </p>

      {ctaLabel && (
        <a
          href={ctaLink ?? '#'}
          className="flex-shrink-0 px-6 py-2.5 text-sm font-semibold text-white border border-white/70 rounded hover:bg-white hover:text-[#3B4BC8] transition-colors whitespace-nowrap"
        >
          {ctaLabel}
        </a>
      )}
    </section>
  )
}
