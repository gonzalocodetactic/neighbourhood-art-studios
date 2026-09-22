import { getMediaUrl } from '@/utilities/getMediaUrl'

type MediaDoc = { url?: string; alt?: string }

type ProgramCard = {
  id?: string
  backgroundImage?: MediaDoc | number | string | null
  cardTitle: string
  cardSubtitle?: string | null
  hoverDescription?: string | null
  link?: string | null
}

type ProgramFlipCardsProps = {
  subtitle?: string | null
  title: string
  cards?: ProgramCard[]
}

const CARD_GRADIENTS = [
  'linear-gradient(160deg,#0a0a1a 0%,#1a1a4e 100%)',
  'linear-gradient(160deg,#1a0a0a 0%,#4e1a1a 100%)',
  'linear-gradient(160deg,#0a1a0a 0%,#1a4e1a 100%)',
  'linear-gradient(160deg,#1a1a0a 0%,#4e3d1a 100%)',
]

function FlipCard({ card, index }: { card: ProgramCard; index: number }) {
  const url = getMediaUrl(card.backgroundImage)

  return (
    <a href={card.link ?? '#'} className="flip-card h-72 block group">
      <div className="flip-card-inner rounded overflow-hidden shadow-md">
        {/* Front */}
        <div
          className="flip-card-front"
          style={
            url
              ? {
                  backgroundImage: `url(${url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }
          }
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 h-full flex flex-col justify-end p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
              {card.cardSubtitle}
            </p>
            <h3
              className="text-xl font-bold text-white leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {card.cardTitle}
            </h3>
          </div>
        </div>

        {/* Back */}
        <div className="flip-card-back bg-[#3B4BC8] flex flex-col items-center justify-center p-8 text-center">
          <h3
            className="text-xl font-bold text-white mb-4"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {card.cardTitle}
          </h3>
          {card.hoverDescription && (
            <p className="text-sm text-white/85 leading-relaxed">{card.hoverDescription}</p>
          )}
          <span className="mt-6 inline-block px-5 py-1.5 text-xs font-semibold text-[#3B4BC8] bg-white rounded hover:bg-white/90 transition-colors">
            Learn More
          </span>
        </div>
      </div>
    </a>
  )
}

export function ProgramFlipCards({ subtitle, title, cards = [] }: ProgramFlipCardsProps) {
  return (
    <section className="py-16 px-12" style={{ backgroundColor: 'var(--nas-bg-gray)' }}>
      <div className="text-center mb-10">
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
      </div>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, 1fr)` }}
      >
        {cards.map((card, i) => (
          <FlipCard key={card.id ?? i} card={card} index={i} />
        ))}
      </div>
    </section>
  )
}
