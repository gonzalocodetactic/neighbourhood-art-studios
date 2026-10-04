import type { CollectionConfig } from 'payload'
import { roleCrud } from '../access'
import { sendWaitlistInvite } from '../emails/sendWaitlistInvite'

export const Waitlist: CollectionConfig = {
  slug: 'waitlist',
  access: roleCrud('waitlist'),
  admin: {
    group: 'Main',
    useAsTitle: 'parentEmail',
    defaultColumns: ['parentName', 'parentEmail', 'product', 'status', 'createdAt'],
  },
  hooks: {
    afterChange: [
      // Email the parent when staff move an entry to "Invited"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ doc, previousDoc, operation, req }: any) => {
        if (operation !== 'update' || doc.status !== 'invited' || previousDoc?.status === 'invited') return
        try {
          await sendWaitlistInvite(req.payload, doc)
        } catch (err) {
          console.error('Waitlist invite email failed:', err)
        }
      },
    ],
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
      admin: {
        description: 'Changing this to "Invited" emails the parent a link to register.',
      },
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
