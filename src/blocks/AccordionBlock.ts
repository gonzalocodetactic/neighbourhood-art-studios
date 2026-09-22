import type { Block } from 'payload'

export const AccordionBlock: Block = {
  slug: 'accordionBlock',
  interfaceName: 'AccordionBlock',
  labels: { singular: 'Accordion', plural: 'Accordions' },
  fields: [
    { name: 'title', type: 'text', label: 'Section Title (optional)' },
    {
      name: 'items',
      type: 'array',
      label: 'Accordion Items',
      minRows: 1,
      fields: [
        { name: 'heading', type: 'text', required: true, label: 'Question / Heading' },
        { name: 'content', type: 'textarea', required: true, label: 'Answer / Content' },
        {
          name: 'defaultOpen',
          type: 'checkbox',
          defaultValue: false,
          label: 'Open by default',
        },
      ],
    },
  ],
}
