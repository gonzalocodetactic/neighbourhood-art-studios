import type { CollectionConfig } from 'payload'

export const Parents: CollectionConfig = {
  slug: 'parents',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'lastLoginAt', 'registrationCount', 'createdAt'],
    components: {
      edit: {
        beforeDocumentControls: [
          '/src/components/admin/SendPasswordResetButton#SendPasswordResetButton',
        ],
      },
    },
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
      ],
    },
    { name: 'phone', type: 'text' },
    {
      name: 'lastLoginAt',
      type: 'date',
      label: 'Last Login',
      admin: {
        readOnly: true,
        description: 'Set automatically on sign-up; updated by hooks on subsequent logins.',
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'registrationCount',
      type: 'number',
      label: 'Registrations',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Auto-updated when registrations are saved.',
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Admin Notes',
      admin: {
        description: 'Internal notes visible only to admin staff.',
        position: 'sidebar',
      },
    },
    {
      name: 'billingAddress',
      type: 'group',
      label: 'Billing Address',
      fields: [
        { name: 'street', type: 'text', label: 'Street Address' },
        { name: 'city', type: 'text', label: 'City' },
        { name: 'province', type: 'text', label: 'Province / State' },
        { name: 'postalCode', type: 'text', label: 'Postal Code' },
      ],
    },
    {
      name: 'savedPaymentToken',
      type: 'text',
      label: 'Moneris Vault Token',
      admin: { readOnly: true, position: 'sidebar', description: 'Auto-populated by Moneris vault response.' },
    },
    {
      name: 'savedPaymentLast4',
      type: 'text',
      label: 'Card Last 4 Digits',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'savedPaymentExpiry',
      type: 'text',
      label: 'Card Expiry (MM/YY)',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
