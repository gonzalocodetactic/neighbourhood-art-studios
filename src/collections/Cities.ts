import type { CollectionConfig } from 'payload'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    group: 'Attributes',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
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
      admin: {
        placeholder: 'e.g. north-vancouver',
      },
    },
  ],
}
