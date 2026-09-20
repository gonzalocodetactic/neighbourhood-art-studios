import { CascadingMediaContent } from './blocks/CascadingMediaContent'
import { FooterCta } from './blocks/FooterCta'
import { Hero } from './blocks/Hero'
import { HighlightCallout } from './blocks/HighlightCallout'
import { InstructorsGrid } from './blocks/InstructorsGrid'
import { ProgramFlipCards } from './blocks/ProgramFlipCards'
import { TestimonialsSlider } from './blocks/TestimonialsSlider'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = Record<string, any>

export function BlockRenderer({ block }: { block: AnyBlock }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = block as any

  switch (block.blockType) {
    case 'hero':
      return <Hero {...b} />
    case 'highlightCallout':
      return <HighlightCallout {...b} />
    case 'cascadingMediaContent':
      return <CascadingMediaContent {...b} />
    case 'instructorsGrid':
      return <InstructorsGrid {...b} />
    case 'testimonialsSlider':
      return <TestimonialsSlider {...b} />
    case 'programFlipCards':
      return <ProgramFlipCards {...b} />
    case 'footerCta':
      return <FooterCta {...b} />
    default:
      return null
  }
}
