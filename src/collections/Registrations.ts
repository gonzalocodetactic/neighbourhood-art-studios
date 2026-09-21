import type { CollectionConfig } from 'payload'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  admin: {
    useAsTitle: 'parentFirstName',
    defaultColumns: ['parentFirstName', 'parentLastName', 'parentEmail', 'product', 'paymentStatus', 'attendanceStatus', 'createdAt'],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'parentFirstName',
          type: 'text',
          label: 'Parent / Guardian First Name',
          required: true,
        },
        {
          name: 'parentLastName',
          type: 'text',
          label: 'Parent / Guardian Last Name',
          required: true,
        },
      ],
    },
    {
      name: 'parentEmail',
      type: 'email',
      required: true,
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
          name: 'emergencyContactFirstName',
          type: 'text',
          label: 'Emergency Contact First Name',
        },
        {
          name: 'emergencyContactLastName',
          type: 'text',
          label: 'Emergency Contact Last Name',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'emergencyContactPhone',
          type: 'text',
          label: 'Emergency Contact Phone',
        },
        {
          name: 'emergencyContactEmail',
          type: 'email',
          label: 'Emergency Contact Email',
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
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          admin: { hidden: true },
        },
        {
          name: 'age',
          type: 'text',
          label: 'Age',
          admin: { placeholder: 'e.g. 8' },
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
        {
          name: 'teacherName',
          type: 'text',
          label: 'Teacher Name',
          admin: { placeholder: 'e.g. Ms. Johnson' },
        },
        {
          name: 'divisionNumber',
          type: 'text',
          label: 'Division Number',
          admin: { placeholder: 'e.g. Div. 4' },
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
      name: 'classDate',
      type: 'text',
      label: 'Class Date / Schedule',
      admin: {
        description: 'Pre-filled from the product variation schedule (e.g. Tuesday · 3:30 PM).',
      },
    },
    {
      name: 'monerisOrderId',
      type: 'text',
      label: 'Moneris Order ID',
      admin: {
        description: 'Set automatically when payment is initiated.',
        readOnly: true,
      },
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
