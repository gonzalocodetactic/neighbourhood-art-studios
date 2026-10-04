import { getMediaUrl } from '@/utilities/getMediaUrl'

type Feature = { icon?: { url?: string; alt?: string } | null; title: string; description?: string }

export function FeatureGrid({ title, features = [] }: { title: string; features?: Feature[] }) {
  return (
    <section className="py-16 px-8 bg-white">
      <h2
        className="text-3xl font-bold text-gray-900 text-center mb-12"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {title}
      </h2>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f, i) => {
          return (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              {f.icon && (
                // Full card-width cover photo
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getMediaUrl(f.icon)} alt={f.icon.alt ?? f.title} className="w-full h-56 object-cover rounded-lg shadow-md mb-2" />
              )}
              <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
              {f.description && <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
