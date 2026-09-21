import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Cities } from './src/collections/Cities'
import { Forms } from './src/collections/Forms'
import { Media } from './src/collections/Media'
import { Pages } from './src/collections/Pages'
import { Products } from './src/collections/Products'
import { Registrations } from './src/collections/Registrations'
import { Schools } from './src/collections/Schools'
import { Seasons } from './src/collections/Seasons'
import { Waitlist } from './src/collections/Waitlist'
import { PaymentSettings } from './src/globals/PaymentSettings'
import { HeaderSettings } from './src/globals/HeaderSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
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
  ],
  globals: [PaymentSettings, HeaderSettings],
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
