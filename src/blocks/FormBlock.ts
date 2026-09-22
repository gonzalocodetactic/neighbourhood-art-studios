import type { Block } from 'payload'

export const FormBlock: Block = {
  slug: 'formBlock',
  interfaceName: 'FormBlock',
  labels: { singular: 'Form', plural: 'Forms' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading (optional)' },
    { name: 'subheading', type: 'text', label: 'Subheading (optional)' },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      label: 'Form',
    },
  ],
}
