import type { Block } from 'payload'

export const FeatureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  labels: { singular: 'Feature Grid', plural: 'Feature Grids' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      fields: [
        { name: 'icon', type: 'upload', relationTo: 'media', label: 'Icon / Image' },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
