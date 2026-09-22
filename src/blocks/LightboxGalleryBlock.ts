import type { Block } from 'payload'

export const LightboxGalleryBlock: Block = {
  slug: 'lightboxGallery',
  interfaceName: 'LightboxGalleryBlock',
  labels: { singular: 'Lightbox Gallery', plural: 'Lightbox Galleries' },
  fields: [
    { name: 'title', type: 'text', label: 'Section Title (optional)' },
    {
      name: 'images',
      type: 'array',
      label: 'Gallery Images',
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', label: 'Caption (optional)' },
      ],
    },
  ],
}
