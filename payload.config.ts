import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Cities } from './src/collections/Cities'
import { Forms } from './src/collections/Forms'
import { Media } from './src/collections/Media'
import { Pages } from './src/collections/Pages'
import { Parents } from './src/collections/Parents'
import { Products } from './src/collections/Products'
import { Registrations } from './src/collections/Registrations'
import { Schools } from './src/collections/Schools'
import { Seasons } from './src/collections/Seasons'
import { Waitlist } from './src/collections/Waitlist'
import { EmailSettings } from './src/globals/EmailSettings'
import { PaymentSettings } from './src/globals/PaymentSettings'
import { HeaderSettings } from './src/globals/HeaderSettings'
import { FooterSettings } from './src/globals/FooterSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    components: {
      graphics: {
        Logo: '/src/components/admin/Logo#Logo',
        Icon: '/src/components/admin/Icon#Icon',
      },
      views: {
        studentRoster: {
          Component: '/src/components/admin/StudentRoster#StudentRoster',
          path: '/student-roster',
          meta: {
            title: 'Student Roster',
            description: 'Flattened class roster across all registrations.',
          },
        },
        bulkVariationEditor: {
          Component: '/src/components/admin/BulkVariationEditor#BulkVariationEditor',
          path: '/bulk-variations',
          meta: {
            title: 'Bulk Variation Editor',
            description: 'Apply price or capacity changes across all product variations.',
          },
        },
      },
    },
    meta: {
      titleSuffix: '- CodeTactic CMS',
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
    },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
    },
    Media,
    Pages,
    Cities,
    Schools,
    Seasons,
    Products,
    Forms,
    Registrations,
    Waitlist,
    Parents,
  ],
  globals: [PaymentSettings, HeaderSettings, FooterSettings, EmailSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
})
