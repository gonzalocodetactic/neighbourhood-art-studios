import type { CollectionConfig } from 'payload'
import { staff, staffOrSelf } from '../access'

export const Parents: CollectionConfig = {
  slug: 'parents',
  // Parents can read/update their own record (account page uses the REST API)
  access: {
    read: staffOrSelf('parents'),
    update: staffOrSelf('parents'),
    create: staff,
    delete: staff,
  },
  auth: true,
  admin: {
    group: 'Main',
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'phone', 'accountStatus', 'lastLoginAt', 'registrationCount', 'totalSpent', 'childrenSummary'],
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
      name: 'totalSpent',
      type: 'number',
      label: 'Total Spent (CAD $)',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Sum of paid registration totals in CAD dollars. Auto-updated.',
      },
    },
    {
      name: 'childrenSummary',
      type: 'text',
      label: 'Children',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'First names from all registrations. Auto-updated.',
      },
    },
    {
      name: 'accountStatus',
      type: 'select',
      label: 'Account Status',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Lapsed', value: 'lapsed' },
      ],
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Active = has a registration within the last 6 months.',
      },
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
