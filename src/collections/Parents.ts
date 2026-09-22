import type { CollectionConfig } from 'payload'

export const Parents: CollectionConfig = {
  slug: 'parents',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'createdAt'],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
      ],
    },
    { name: 'phone', type: 'text' },
  ],
}
