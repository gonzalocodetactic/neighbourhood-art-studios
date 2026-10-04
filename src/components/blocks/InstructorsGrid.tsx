import { getMediaUrl, getMediaAlt } from '@/utilities/getMediaUrl'

type MediaDoc = { url?: string; alt?: string }

type Instructor = {
  id?: string
  image?: MediaDoc | number | string | null
  name: string
  role?: string | null
}

type InstructorsGridProps = {
  subtitle?: string | null
  title: string
  instructors?: Instructor[]
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
]

export function InstructorsGrid({ subtitle, title, instructors = [] }: InstructorsGridProps) {
  return (
    <section className="py-12 md:py-16 px-6 md:px-12 bg-white">
      <div className="text-center mb-12">
        {subtitle && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            {subtitle}
          </p>
        )}
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {title}
        </h2>
        <div className="mx-auto mt-4 w-12 h-0.5 bg-[#3B4BC8]" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 justify-items-center">
        {instructors.map((instructor, i) => {
          const url = getMediaUrl(instructor.image)
          const alt = getMediaAlt(instructor.image)

          return (
            <div key={instructor.id ?? i} className="flex flex-col items-center text-center gap-3">
              <div className="w-28 h-28 rounded-full overflow-hidden shadow-md">
                {url ? (
                  <img
                    src={url}
                    alt={alt || instructor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
                  >
                    {instructor.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{instructor.name}</p>
                {instructor.role && (
                  <p className="text-xs text-gray-500 mt-0.5">{instructor.role}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
