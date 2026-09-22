import type { Block } from 'payload'

export const HorizontalSliderBlock: Block = {
  slug: 'horizontalSlider',
  interfaceName: 'HorizontalSliderBlock',
  labels: { singular: 'Horizontal Slider', plural: 'Horizontal Sliders' },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Slides',
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', label: 'Caption (optional)' },
      ],
    },
    {
      name: 'speed',
      type: 'number',
      label: 'Scroll Speed (seconds for one full loop)',
      defaultValue: 30,
      admin: { description: 'Lower = faster. Default 30s.' },
    },
    {
      name: 'imageHeight',
      type: 'number',
      label: 'Image Height (px)',
      defaultValue: 320,
    },
  ],
}
