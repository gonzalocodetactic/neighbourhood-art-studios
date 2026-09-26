import type { CollectionConfig } from 'payload'
import { staffCrud } from '../access'

export const Seasons: CollectionConfig = {
  slug: 'seasons',
  access: staffCrud,
  admin: {
    group: 'Attributes',
    useAsTitle: 'title',
    defaultColumns: ['title', 'active'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g. Fall 2026, Summer 2027',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
