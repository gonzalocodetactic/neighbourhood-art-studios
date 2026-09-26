import type { CollectionConfig } from 'payload'
import { staffCrud } from '../access'

export const Timeslots: CollectionConfig = {
  slug: 'timeslots',
  access: staffCrud,
  admin: {
    group: 'Attributes',
    useAsTitle: 'label',
    defaultColumns: ['label', 'startTime', 'endTime'],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { placeholder: 'e.g. 9:30 AM – 3:00 PM' },
    },
    {
      name: 'startTime',
      type: 'text',
      admin: { placeholder: 'e.g. 09:30' },
    },
    {
      name: 'endTime',
      type: 'text',
      admin: { placeholder: 'e.g. 15:00' },
    },
  ],
}
