import { RichText } from '@payloadcms/richtext-lexical/react'
import { getMediaUrl, getMediaAlt } from '@/utilities/getMediaUrl'

type MediaDoc = { url?: string; alt?: string }

type ImageItem = {
  id?: string
  image?: MediaDoc | number | string | null
}

type CascadingMediaContentProps = {
  subtitle?: string | null
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paragraph?: any
  direction?: 'imageLeft' | 'textLeft'
  images?: ImageItem[]
}

// Placeholder gradients for when no real image is uploaded yet
const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
]

// Fixed rotation/offset values per image position for the cascade effect
const CASCADE_STYLES = [
  { top: 0, left: 0, rotate: -3 },
  { top: 32, left: 64, rotate: 2.5 },
  { top: 64, left: 24, rotate: -1.5 },
  { top: 48, left: 88, rotate: 4 },
]

function CascadeStack({ images }: { images: ImageItem[] }) {
  return (
    <div className="relative h-80 w-full cascade-wrap">
      {images.slice(0, 4).map((item, i) => {
        const url = getMediaUrl(item.image)
        const alt = getMediaAlt(item.image)
        const style = CASCADE_STYLES[i]

        return (
          <div
            key={item.id ?? i}
            className="cascade-img absolute w-44 h-56 shadow-lg"
            style={{
              top: style.top,
              left: style.left,
              transform: `rotate(${style.rotate}deg)`,
            }}
          >
            {url ? (
              <img
                src={url}
                alt={alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length] }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CascadingMediaContent({
  subtitle,
  title,
  paragraph,
  direction = 'imageLeft',
  images = [],
}: CascadingMediaContentProps) {
  const mediaCol = <CascadeStack images={images} />

  const textCol = (
    <div className="flex flex-col justify-center">
      {subtitle && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          {subtitle}
        </p>
      )}
      <h2
        className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {title}
      </h2>
      {paragraph && (
        <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none">
          <RichText data={paragraph} />
        </div>
      )}
    </div>
  )

  return (
    <section className="py-16 px-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
        {direction === 'imageLeft' ? (
          <>
            <div className="col-span-1 w-full">{mediaCol}</div>
            <div className="col-span-1 w-full">{textCol}</div>
          </>
        ) : (
          <>
            <div className="col-span-1 w-full">{textCol}</div>
            <div className="col-span-1 w-full">{mediaCol}</div>
          </>
        )}
      </div>
    </section>
  )
}
