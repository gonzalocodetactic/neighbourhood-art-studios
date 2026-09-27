import type { CollectionConfig } from 'payload'
import { roleCrud } from '../access'

export const Products: CollectionConfig = {
  slug: 'products',
  access: roleCrud('products'),
  admin: {
    useAsTitle: 'title',
    group: 'Main',
    defaultColumns: ['title', 'updatedAt'],
    components: {
      edit: {
        beforeDocumentControls: [
          '/src/components/admin/BulkVariationModal#BulkVariationModal',
        ],
      },
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
      name: 'productType',
      type: 'select',
      defaultValue: 'in-school',
      options: [
        { label: 'In-School Art Classes', value: 'in-school' },
        { label: 'Art Camp', value: 'camp' },
        { label: 'Workshop', value: 'workshop' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'variations',
      type: 'array',
      label: 'Variations',
      admin: {
        description:
          'In-school products: one row per city–school–season. Camp / session products: one row per location–timeslot–camp week.',
      },
      fields: [
        {
          name: 'city',
          type: 'relationship',
          relationTo: 'cities',
                  },
        {
          name: 'school',
          type: 'relationship',
          relationTo: 'schools',
                  },
        {
          name: 'season',
          type: 'relationship',
          relationTo: 'seasons',
                  },
        {
          name: 'location',
          type: 'relationship',
          relationTo: 'locations',
          admin: { description: 'Camp / session products only.' },
        },
        {
          name: 'timeslot',
          type: 'relationship',
          relationTo: 'timeslots',
          admin: { description: 'Camp / session products only.' },
        },
        {
          name: 'campWeek',
          type: 'relationship',
          relationTo: 'camp-weeks',
          admin: { description: 'Camp / session products only.' },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          defaultValue: 225,
          min: 0,
          admin: {
            description: 'Price in CAD dollars (e.g. 180.00)',
            step: 0.01,
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
          name: 'registeredCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Auto-incremented when camp / session registrations are created.',
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'open',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Waitlist', value: 'waitlist' },
            { label: 'Closed', value: 'closed' },
          ],
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
