import type { CollectionConfig } from 'payload'

export const Schools: CollectionConfig = {
  slug: 'schools',
  admin: {
    group: 'Attributes',
    useAsTitle: 'title',
    defaultColumns: ['title', 'city', 'active'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      required: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
