import type { CollectionConfig } from 'payload'

export const CampWeeks: CollectionConfig = {
  slug: 'camp-weeks',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'startDate', 'endDate'],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { placeholder: 'e.g. July 7 – 11' },
    },
    {
      name: 'startDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'MMM d, yyyy' },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'MMM d, yyyy' },
      },
    },
  ],
}
