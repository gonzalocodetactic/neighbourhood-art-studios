import type { Block } from 'payload'

export const OrderSummaryBlock: Block = {
  slug: 'orderSummary',
  interfaceName: 'OrderSummaryBlock',
  labels: { singular: 'Order Summary', plural: 'Order Summaries' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Thank you for your registration!',
    },
    {
      name: 'subheading',
      type: 'textarea',
      defaultValue: 'Here are your registration details and receipt summary.',
    },
    {
      name: 'supportText',
      type: 'textarea',
      label: 'Support / Next Steps Text',
      admin: {
        description: 'Optional message shown below the order details (e.g. what to expect next, contact info).',
      },
    },
    {
      name: 'showPrintButton',
      type: 'checkbox',
      label: 'Show Print Button',
      defaultValue: true,
    },
    {
      name: 'homeButtonText',
      type: 'text',
      label: 'Home Button Label',
      defaultValue: 'Return to Home',
    },
  ],
}
