import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'ctaLabel', type: 'text', label: 'CTA Button Label' },
    { name: 'ctaLink', type: 'text', label: 'CTA Link' },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
  ],
}
