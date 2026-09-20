import type { CollectionConfig } from 'payload'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  admin: {
    useAsTitle: 'parentName',
    defaultColumns: ['parentName', 'parentEmail', 'product', 'paymentStatus', 'attendanceStatus', 'createdAt'],
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
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'emergencyContactName',
          type: 'text',
          label: 'Emergency Contact Name',
        },
        {
          name: 'emergencyContactPhone',
          type: 'text',
          label: 'Emergency Contact Phone',
        },
      ],
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
          type: 'row',
          fields: [
            {
              name: 'dateOfBirth',
              type: 'date',
            },
            {
              name: 'grade',
              type: 'text',
              admin: {
                placeholder: 'e.g. Grade 3, Kindergarten',
              },
            },
          ],
        },
        {
          name: 'medicalNotes',
          type: 'textarea',
          admin: {
            placeholder: 'Allergies, medications, or other medical information',
          },
        },
        {
          name: 'gender',
          type: 'select',
          label: 'Gender',
          options: [
            { label: 'Boy', value: 'boy' },
            { label: 'Girl', value: 'girl' },
            { label: 'Non-binary', value: 'non-binary' },
            { label: 'Prefer not to say', value: 'prefer-not-to-say' },
          ],
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
      name: 'checkoutAnswers',
      type: 'array',
      label: 'Checkout Field Answers',
      admin: {
        description: "Answers to the product's required checkout questions.",
      },
      fields: [
        {
          name: 'fieldLabel',
          type: 'text',
        },
        {
          name: 'value',
          type: 'text',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'divisionNumber',
          type: 'text',
          label: 'Division Number',
          admin: {
            description: 'Set by the school after scheduling (e.g. Div. 4).',
          },
        },
        {
          name: 'teacherName',
          type: 'text',
          label: 'Teacher Name',
          admin: {
            description: 'Classroom teacher assigned to this registration.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'paymentStatus',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Refunded', value: 'refunded' },
            { label: 'Waived', value: 'waived' },
          ],
        },
        {
          name: 'attendanceStatus',
          type: 'select',
          required: true,
          defaultValue: 'enrolled',
          options: [
            { label: 'Enrolled', value: 'enrolled' },
            { label: 'Attended', value: 'attended' },
            { label: 'No Show', value: 'no-show' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
      ],
    },
  ],
}
