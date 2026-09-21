export function CallToAction({
  heading,
  description,
  buttonText,
  buttonLink,
  backgroundColor = '#3B4BC8',
}: {
  heading: string
  description?: string
  buttonText?: string
  buttonLink?: string
  backgroundColor?: string
}) {
  return (
    <section className="py-16 px-8 text-white text-center" style={{ backgroundColor }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
          {heading}
        </h2>
        {description && <p className="text-base text-white/80 leading-relaxed">{description}</p>}
        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-block mt-4 px-8 py-3 bg-white font-bold text-sm rounded-full transition-opacity hover:opacity-90"
            style={{ color: backgroundColor }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  )
}
