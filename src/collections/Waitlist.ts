import type { CollectionConfig } from 'payload'

export const Waitlist: CollectionConfig = {
  slug: 'waitlist',
  admin: {
    useAsTitle: 'parentEmail',
    defaultColumns: ['parentName', 'parentEmail', 'product', 'status', 'createdAt'],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'parentName',
          type: 'text',
          required: true,
        },
        {
          name: 'parentEmail',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'parentPhone',
      type: 'text',
    },
    {
      name: 'students',
      type: 'array',
      label: 'Student(s)',
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'firstName',
              type: 'text',
              required: true,
            },
            {
              name: 'lastName',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'dateOfBirth',
          type: 'date',
        },
        {
          name: 'grade',
          type: 'text',
          label: 'Grade',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'school',
          type: 'relationship',
          relationTo: 'schools',
          required: true,
        },
        {
          name: 'season',
          type: 'relationship',
          relationTo: 'seasons',
          required: true,
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'waiting',
      options: [
        { label: 'Waiting', value: 'waiting' },
        { label: 'Invited', value: 'invited' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this waitlist entry.',
      },
    },
  ],
}
