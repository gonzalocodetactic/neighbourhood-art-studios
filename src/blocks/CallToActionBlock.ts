import type { Block } from 'payload'

export const CallToActionBlock: Block = {
  slug: 'callToAction',
  interfaceName: 'CallToActionBlock',
  labels: { singular: 'Call To Action', plural: 'Calls To Action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'buttonText', type: 'text', label: 'Button Text' },
    { name: 'buttonLink', type: 'text', label: 'Button Link' },
    {
      name: 'backgroundColor',
      type: 'text',
      defaultValue: '#3B4BC8',
      label: 'Background Color (hex)',
      admin: { placeholder: '#3B4BC8' },
    },
  ],
}
