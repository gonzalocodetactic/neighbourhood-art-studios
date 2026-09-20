import type { CollectionConfig } from 'payload'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: { useAsTitle: 'title', group: 'Settings' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'perStudentFields',
      type: 'array',
      label: 'Per-Student Fields',
      admin: { description: 'Dynamic fields shown per student in the registration modal.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { placeholder: 'e.g. Age, Teacher Name' } },
            { name: 'fieldName', type: 'text', required: true, admin: { placeholder: 'camelCase key, e.g. teacherName' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'fieldType',
              type: 'select',
              required: true,
              defaultValue: 'text',
              options: [
                { label: 'Short text', value: 'text' },
                { label: 'Number', value: 'number' },
                { label: 'Select / Dropdown', value: 'select' },
                { label: 'Checkbox', value: 'checkbox' },
              ],
            },
            { name: 'required', type: 'checkbox', defaultValue: false },
          ],
        },
        { name: 'placeholder', type: 'text' },
        {
          name: 'selectOptions',
          type: 'array',
          label: 'Dropdown Options',
          admin: {
            description: 'For Select fields only.',
            condition: (_, sib) => sib?.fieldType === 'select',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
