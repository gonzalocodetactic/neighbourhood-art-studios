import type { CollectionConfig } from 'payload'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: { useAsTitle: 'title', group: 'Settings' },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'formType',
      type: 'select',
      defaultValue: 'general',
      required: true,
      options: [
        { label: 'General / Contact', value: 'general' },
        { label: 'Student Registration', value: 'registration' },
      ],
    },

    // ── General form fields ────────────────────────────────────────────────
    {
      name: 'fields',
      type: 'array',
      label: 'Form Fields',
      admin: {
        description: 'Fields rendered on the public-facing form.',
        condition: (_, sib) => sib?.formType === 'general',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, admin: { placeholder: 'camelCase key, e.g. fullName' } },
            { name: 'label', type: 'text', required: true, admin: { placeholder: 'e.g. Full Name' } },
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
                { label: 'Text', value: 'text' },
                { label: 'Email', value: 'email' },
                { label: 'Textarea', value: 'textarea' },
                { label: 'Select / Dropdown', value: 'select' },
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

    { name: 'submitButtonText', type: 'text', defaultValue: 'Send Message' },
    { name: 'successMessage', type: 'text', defaultValue: 'Thank you! We\'ll be in touch soon.' },

    // ── Student registration per-student fields ────────────────────────────
    {
      name: 'perStudentFields',
      type: 'array',
      label: 'Per-Student Fields',
      admin: {
        description: 'Dynamic fields shown per student in the registration modal.',
        condition: (_, sib) => sib?.formType === 'registration',
      },
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
        {
          name: 'width',
          type: 'select',
          defaultValue: '100%',
          options: [
            { label: 'Full Width', value: '100%' },
            { label: 'Half Width', value: '50%' },
            { label: 'One-Third Width', value: '33%' },
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
