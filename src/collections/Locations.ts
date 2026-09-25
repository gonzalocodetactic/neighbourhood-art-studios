import type { CollectionConfig } from 'payload'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'address'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { placeholder: 'e.g. Gracepoint Church' },
    },
    {
      name: 'address',
      type: 'text',
      admin: { placeholder: 'e.g. 13775 64 Ave, Surrey, BC' },
    },
    {
      name: 'city',
      type: 'text',
      admin: { placeholder: 'e.g. Surrey' },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
