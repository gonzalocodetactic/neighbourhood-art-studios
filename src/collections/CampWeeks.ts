import type { CollectionConfig } from 'payload'
import { roleCrud } from '../access'

export const CampWeeks: CollectionConfig = {
  slug: 'camp-weeks',
  access: roleCrud('campWeeks'),
  admin: {
    group: 'Attributes',
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
