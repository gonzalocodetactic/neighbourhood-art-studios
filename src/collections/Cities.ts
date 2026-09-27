import type { CollectionConfig } from 'payload'
import { roleCrud } from '../access'

export const Cities: CollectionConfig = {
  slug: 'cities',
  access: roleCrud('cities'),
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
