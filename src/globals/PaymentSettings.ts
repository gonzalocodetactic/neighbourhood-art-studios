import type { GlobalConfig } from 'payload'

export const PaymentSettings: GlobalConfig = {
  slug: 'payment-settings',
  label: 'Payment Settings',
  admin: {
    group: 'Settings',
  },
  fields: [
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
