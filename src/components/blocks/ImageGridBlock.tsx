type MediaDoc = { url?: string; alt?: string }
type GridImage = { id?: string; image?: MediaDoc | number | string | null; caption?: string | null }

type Props = {
  title?: string | null
  columns?: '2' | '3' | '4' | null
  images?: GridImage[]
}

function resolveUrl(val: MediaDoc | number | string | null | undefined): string | null {
  if (!val || typeof val !== 'object') return null
  return (val as MediaDoc).url ?? null
}
function resolveAlt(val: MediaDoc | number | string | null | undefined): string {
  if (!val || typeof val !== 'object') return ''
  return (val as MediaDoc).alt ?? ''
}

const colClass: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}

export function ImageGridBlock({ title, columns = '3', images = [] }: Props) {
  if (!images.length) return null
  const gridCols = colClass[columns ?? '3'] ?? colClass['3']

  return (
    <section className="py-14 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {title}
          </h2>
        )}
        <div className={`grid ${gridCols} gap-4`}>
          {images.map((item, i) => {
            const url = resolveUrl(item.image)
            const alt = resolveAlt(item.image)
            return (
              <div key={item.id ?? i} className="relative aspect-[3/2] overflow-hidden rounded-lg bg-gray-200 group">
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
                {item.caption && (
                  <p className="absolute bottom-0 left-0 right-0 text-[11px] text-white text-center py-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.caption}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
