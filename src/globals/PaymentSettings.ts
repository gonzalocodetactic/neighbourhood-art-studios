import type { GlobalConfig } from 'payload'

export const PaymentSettings: GlobalConfig = {
  slug: 'payment-settings',
  label: 'Payment Settings',
  admin: {
    group: 'Settings',
  },
  fields: [
    // ── GST / Tax ───────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'gstEnabled',
          type: 'checkbox',
          label: 'Collect GST',
          defaultValue: true,
        },
        {
          name: 'gstRate',
          type: 'number',
          label: 'GST Rate (%)',
          defaultValue: 5,
          min: 0,
          max: 100,
          admin: { placeholder: '5' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'gstLabel',
          type: 'text',
          label: 'GST Label',
          defaultValue: 'GST (BC 5%)',
          admin: { placeholder: 'GST (BC 5%)' },
        },
        {
          name: 'gstNumber',
          type: 'text',
          label: 'GST Registration #',
          admin: { placeholder: 'e.g. 123456789 RT0001' },
        },
      ],
    },
    // ── Moneris ─────────────────────────────────────────────────────────────
    {
      name: 'monerisStoreId',
      type: 'text',
      label: 'Moneris Store ID',
    },
    {
      name: 'monerisApiToken',
      type: 'text',
      label: 'Moneris API Token',
      admin: {
        description: 'Sensitive — treat as a password. Do not share.',
      },
    },
    {
      name: 'monerisEnvironment',
      type: 'select',
      label: 'Environment',
      defaultValue: 'qa',
      options: [
        { label: 'Testing (QA)', value: 'qa' },
        { label: 'Live (Production)', value: 'prod' },
      ],
    },
    {
      name: 'monerisCheckoutUrl',
      type: 'text',
      label: 'Moneris Checkout URL',
      defaultValue: 'https://www3.moneris.com/HPPCl/index.php',
      admin: {
        description: 'Override only if Moneris provides a custom endpoint.',
      },
    },
  ],
}
