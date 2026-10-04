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

// Position, rotation and stacking per image, in % of the media column so the
// stack scales with its 50% column. Each photo is 56% of the column wide (4:5);
// offsets keep the whole stack inside the 6:5 frame.
const CASCADE_STYLES = [
  { top: '0%', left: '0%', rotate: -3, z: 4 },
  { top: '8%', left: '44%', rotate: 2.5, z: 3 },
  { top: '16%', left: '18%', rotate: -1.5, z: 2 },
  { top: '12%', left: '30%', rotate: 4, z: 1 },
]

function CascadeStack({ images }: { images: ImageItem[] }) {
  // A single photo just fills the column
  if (images.length === 1) {
    const url = getMediaUrl(images[0].image)
    return (
      <div className="w-full aspect-[6/5] overflow-hidden shadow-lg">
        {url ? (
          <img src={url} alt={getMediaAlt(images[0].image)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: PLACEHOLDER_GRADIENTS[0] }} />
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[6/5]">
      {images.slice(0, 4).map((item, i) => {
        const url = getMediaUrl(item.image)
        const alt = getMediaAlt(item.image)
        const style = CASCADE_STYLES[i]

        return (
          <div
            key={item.id ?? i}
            className="absolute w-[56%] aspect-[4/5] shadow-lg"
            style={{
              top: style.top,
              left: style.left,
              zIndex: style.z,
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
    <section className="py-12 md:py-16 px-6 md:px-12">
      {/* Exact 50/50: equal fractional columns, media column fills its half */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
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
