import { getPayload } from 'payload'
import config from '../payload.config'
import type { Role } from '../payload-types'
import { OPERATIONS, PERMISSION_COLLECTIONS, type Operation, type PermissionCollection } from './access'

// Default custom roles; re-running only creates the ones that are missing, so
// edits made in the admin are never overwritten
const grant = (allow: (slug: PermissionCollection, op: Operation) => boolean) =>
  Object.fromEntries(
    PERMISSION_COLLECTIONS.map(({ slug }) => [
      slug,
      Object.fromEntries(OPERATIONS.map((op) => [op, allow(slug, op)])),
    ]),
  )

const ROLES = [
  {
    name: 'Super Admin',
    description: 'Full create, read, update and delete on every managed collection, including users.',
    permissions: grant(() => true),
  },
  {
    name: 'Site Administrator',
    description: 'Day-to-day business: full access to registrations, products, schools, locations and waitlists. No user management.',
    permissions: grant((slug) => slug !== 'users'),
  },
  {
    name: 'Roster Viewer',
    description: 'Read-only access to registrations, schools, locations and waitlists, for teachers checking class lists.',
    permissions: grant((slug, op) => op === 'read' && slug !== 'users' && slug !== 'products'),
  },
]

async function main() {
  const payload = await getPayload({ config })
  for (const role of ROLES) {
    const { totalDocs } = await payload.count({ collection: 'roles', where: { name: { equals: role.name } } })
    if (totalDocs > 0) {
      console.log(`exists  ${role.name}`)
      continue
    }
    await payload.create({ collection: 'roles', data: role as Omit<Role, 'id' | 'createdAt' | 'updatedAt'> })
    console.log(`created ${role.name}`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
