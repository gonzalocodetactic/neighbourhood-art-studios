import type { Block } from 'payload'

export const ImageGridBlock: Block = {
  slug: 'imageGrid',
  interfaceName: 'ImageGridBlock',
  labels: { singular: 'Image Grid', plural: 'Image Grids' },
  fields: [
    { name: 'title', type: 'text', label: 'Section Title (optional)' },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      label: 'Columns',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', label: 'Caption (optional)' },
      ],
    },
  ],
}
