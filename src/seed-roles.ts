import { getPayload } from 'payload'
import config from '../payload.config'
import type { Role } from '../payload-types'
import { OPERATIONS, PERMISSION_COLLECTIONS, type Operation, type PermissionCollection } from './access'

// Default custom roles; re-running only creates the ones that are missing, so
// edits made in the admin are never overwritten
const grant = (allow: (key: PermissionCollection, op: Operation) => boolean) =>
  Object.fromEntries(
    PERMISSION_COLLECTIONS.map(({ key }) => [
      key,
      Object.fromEntries(OPERATIONS.map((op) => [op, allow(key, op)])),
    ]),
  )

// What a teacher needs to make sense of class lists: the registrations plus reference data
const ROSTER_READ: PermissionCollection[] = [
  'registrations', 'schools', 'locations', 'waitlist', 'seasons', 'cities', 'timeslots', 'campWeeks',
]

export const ROLES = [
  {
    name: 'Super Admin',
    description:
      'Full access to every collection, header and footer settings, including users. System settings (payments, email) still need the built-in Super Administrator role.',
    permissions: grant(() => true),
  },
  {
    name: 'Site Administrator',
    description: 'Day-to-day business: full access to every collection plus header and footer settings, except users.',
    permissions: grant((key) => key !== 'users'),
  },
  {
    name: 'Roster Viewer',
    description:
      'Read-only access to registrations, waitlists, schools, locations, seasons, cities, timeslots and camp weeks, for teachers checking class lists.',
    permissions: grant((key, op) => op === 'read' && ROSTER_READ.includes(key)),
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

if (process.argv[1]?.endsWith('seed-roles.ts')) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
