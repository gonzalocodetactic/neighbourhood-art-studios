import type { CollectionConfig } from 'payload'

export const CampSessions: CollectionConfig = {
  slug: 'camp-sessions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['product', 'location', 'campWeek', 'timeslot', 'capacity', 'registeredCount', 'status'],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      required: true,
    },
    {
      name: 'timeslot',
      type: 'relationship',
      relationTo: 'timeslots',
      required: true,
    },
    {
      name: 'campWeek',
      type: 'relationship',
      relationTo: 'camp-weeks',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      defaultValue: 225,
      min: 0,
      admin: {
        description: 'Price in CAD dollars (e.g. 225.00)',
        step: 0.01,
      },
    },
    {
      name: 'capacity',
      type: 'number',
      defaultValue: 20,
      min: 1,
      admin: {
        description: 'Maximum number of students.',
      },
    },
    {
      name: 'registeredCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Auto-incremented when registrations are created.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Waitlist', value: 'waitlist' },
        { label: 'Closed', value: 'closed' },
      ],
    },
  ],
}
