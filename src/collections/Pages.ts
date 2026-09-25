import type { Block, CollectionConfig } from 'payload'
import { HeroBlock } from '../blocks/HeroBlock'
import { FeatureGridBlock } from '../blocks/FeatureGridBlock'
import { CallToActionBlock } from '../blocks/CallToActionBlock'
import { FormBlock } from '../blocks/FormBlock'
import { HorizontalSliderBlock } from '../blocks/HorizontalSliderBlock'
import { AccordionBlock } from '../blocks/AccordionBlock'
import { ImageGridBlock } from '../blocks/ImageGridBlock'
import { LightboxGalleryBlock } from '../blocks/LightboxGalleryBlock'
import { OrderSummaryBlock } from '../blocks/OrderSummaryBlock'

// ── Blocks ────────────────────────────────────────────────────────────────────

const HighlightCalloutBlock: Block = {
  slug: 'highlightCallout',
  interfaceName: 'HighlightCalloutBlock',
  labels: { singular: 'Highlight Callout', plural: 'Highlight Callouts' },
  fields: [
    {
      name: 'backgroundColor',
      type: 'text',
      defaultValue: '#3B4BC8',
      label: 'Background Color (hex)',
      admin: { placeholder: '#3B4BC8' },
    },
    { name: 'text', type: 'textarea', required: true },
    { name: 'ctaLabel', type: 'text', label: 'CTA Button Label' },
    { name: 'ctaLink', type: 'text', label: 'CTA Link' },
  ],
}

const CascadingMediaContentBlock: Block = {
  slug: 'cascadingMediaContent',
  interfaceName: 'CascadingMediaContentBlock',
  labels: { singular: 'Cascading Media + Content', plural: 'Cascading Media + Content' },
  fields: [
    { name: 'subtitle', type: 'text', label: 'Subtitle (small label above title)' },
    { name: 'title', type: 'text', required: true },
    { name: 'paragraph', type: 'richText', label: 'Content' },
    {
      name: 'direction',
      type: 'select',
      defaultValue: 'imageLeft',
      options: [
        { label: 'Images Left / Text Right', value: 'imageLeft' },
        { label: 'Text Left / Images Right', value: 'textLeft' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      label: 'Stacked Images',
      maxRows: 4,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
      ],
    },
  ],
}

const InstructorsGridBlock: Block = {
  slug: 'instructorsGrid',
  interfaceName: 'InstructorsGridBlock',
  labels: { singular: 'Instructors Grid', plural: 'Instructors Grids' },
  fields: [
    { name: 'subtitle', type: 'text', label: 'Subtitle (above title)' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'instructors',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text', label: 'Role / Title' },
      ],
    },
  ],
}

const TestimonialsSliderBlock: Block = {
  slug: 'testimonialsSlider',
  interfaceName: 'TestimonialsSliderBlock',
  labels: { singular: 'Testimonials Slider', plural: 'Testimonials Sliders' },
  fields: [
    { name: 'subtitle', type: 'text', label: 'Subtitle (above title)' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'testimonials',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'clientName', type: 'text', required: true },
        { name: 'clientSubtext', type: 'text', label: 'Client Details / Role' },
      ],
    },
  ],
}

const ProgramFlipCardsBlock: Block = {
  slug: 'programFlipCards',
  interfaceName: 'ProgramFlipCardsBlock',
  labels: { singular: 'Program Flip Cards', plural: 'Program Flip Cards' },
  fields: [
    { name: 'subtitle', type: 'text', label: 'Subtitle (above title)' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'cards',
      type: 'array',
      fields: [
        { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
        { name: 'cardTitle', type: 'text', required: true },
        { name: 'cardSubtitle', type: 'text' },
        { name: 'hoverDescription', type: 'textarea', label: 'Description (shown on hover/back)' },
        { name: 'link', type: 'text' },
      ],
    },
  ],
}

const FooterCtaBlock: Block = {
  slug: 'footerCta',
  interfaceName: 'FooterCtaBlock',
  labels: { singular: 'Footer CTA', plural: 'Footer CTAs' },
  fields: [
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
    { name: 'topTagline', type: 'text', label: 'Top Tagline' },
    { name: 'headline', type: 'text', required: true, label: 'Main Headline' },
    { name: 'primaryCtaLabel', type: 'text', label: 'Primary CTA Label' },
    { name: 'primaryCtaLink', type: 'text', label: 'Primary CTA Link' },
  ],
}

// ── Collection ────────────────────────────────────────────────────────────────

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'System / Users',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'termsContent',
      type: 'textarea',
      label: 'Terms & Conditions Text',
      admin: {
        description: 'Plain-text terms shown inline in the registration modal (only used on the terms-and-conditions page).',
        position: 'sidebar',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        HeroBlock,
        HighlightCalloutBlock,
        CascadingMediaContentBlock,
        InstructorsGridBlock,
        TestimonialsSliderBlock,
        ProgramFlipCardsBlock,
        FooterCtaBlock,
        FeatureGridBlock,
        CallToActionBlock,
        FormBlock,
        HorizontalSliderBlock,
        AccordionBlock,
        ImageGridBlock,
        LightboxGalleryBlock,
        OrderSummaryBlock,
      ],
    },
  ],
}
