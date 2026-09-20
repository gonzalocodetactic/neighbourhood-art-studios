import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
    components: {
      views: {
        edit: {
          bulkGenerator: {
            Component: '/src/components/products/BulkVariationGenerator#BulkVariationGenerator',
            path: '/bulk-generator',
            tab: {
              label: 'Bulk Generator',
            },
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'variations',
      type: 'array',
      label: 'School / City / Season Variations',
      admin: {
        description: 'One row per city–school–season combination this product is offered in.',
      },
      fields: [
        {
          name: 'city',
          type: 'relationship',
          relationTo: 'cities',
          required: true,
        },
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
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Price in CAD cents (e.g. 15000 = $150.00)',
          },
        },
        {
          name: 'capacity',
          type: 'number',
          defaultValue: 20,
          min: 1,
          admin: {
            description: 'Maximum number of students for this variation.',
          },
        },
        {
          name: 'dayOfWeek',
          type: 'text',
          label: 'Day of Week',
          admin: {
            placeholder: 'e.g. Tuesday',
            description: 'Optional: the day this class runs.',
          },
        },
        {
          name: 'timeSlot',
          type: 'text',
          label: 'Time Slot',
          admin: {
            placeholder: 'e.g. 3:30 PM – 4:30 PM',
            description: 'Optional: the time window for this class.',
          },
        },
      ],
    },
    {
      name: 'registrationForm',
      type: 'relationship',
      relationTo: 'forms',
      label: 'Registration Form',
      admin: {
        description: 'Defines dynamic per-student fields in the registration modal. Leave blank to use defaults (Age, Gender, Teacher Name, Division).',
        position: 'sidebar',
      },
    },
    {
      name: 'checkoutFields',
      type: 'array',
      label: 'Required Checkout Fields',
      admin: {
        description: 'Extra questions shown to parents at checkout (e.g. allergies, emergency contact).',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            placeholder: 'e.g. Does your child have any allergies?',
          },
        },
        {
          name: 'fieldType',
          type: 'select',
          required: true,
          defaultValue: 'text',
          options: [
            { label: 'Short text', value: 'text' },
            { label: 'Long text', value: 'textarea' },
            { label: 'Checkbox (yes/no)', value: 'checkbox' },
          ],
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
