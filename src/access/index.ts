import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Two admin roles, stored on the `users` collection:
 *   super-admin — everything, including user/role management and system settings
 *                 (payment gateway, email delivery).
 *   site-admin  — day-to-day business: registrations, products & variations,
 *                 schools, seasons, parents, content, analytics and the roster.
 *
 * On top of that, a site admin can be given custom roles (the `roles` collection).
 * When they have any, their access to the collections in PERMISSION_COLLECTIONS
 * comes from the union of those roles instead of the site-admin defaults.
 *
 * Parents also authenticate (the `parents` collection), so "logged in" is not
 * enough — staff checks require a `users` account.
 */
export type Role = 'super-admin' | 'site-admin'

type User = PayloadRequest['user']

export const isStaff = (user: User): boolean => user?.collection === 'users'

export const isSuperAdmin = (user: User): boolean =>
  isStaff(user) && (user as { role?: Role }).role === 'super-admin'

export const staff: Access = ({ req }) => isStaff(req.user)

export const superAdmin: Access = ({ req }) => isSuperAdmin(req.user)

export const anyone: Access = () => true

/** Staff see everything; a user of this collection sees only their own document. */
export const staffOrSelf =
  (collection: string): Access =>
  ({ req: { user } }) => {
    if (isStaff(user)) return true
    if (user?.collection === collection) return { id: { equals: user.id } }
    return false
  }

export const superAdminField: FieldAccess = ({ req }) => isSuperAdmin(req.user)

/** Full CRUD for staff (both roles). */
export const staffCrud = { read: staff, create: staff, update: staff, delete: staff }

// ── Custom role permissions ─────────────────────────────────────────────────

export const PERMISSION_COLLECTIONS = [
  { slug: 'registrations', label: 'Registrations' },
  { slug: 'products', label: 'Products' },
  { slug: 'schools', label: 'Schools' },
  { slug: 'users', label: 'Users' },
  { slug: 'locations', label: 'Locations' },
  { slug: 'waitlist', label: 'Waitlists' },
] as const

export const OPERATIONS = ['create', 'read', 'update', 'delete'] as const

export type PermissionCollection = (typeof PERMISSION_COLLECTIONS)[number]['slug']
export type Operation = (typeof OPERATIONS)[number]
export type Permissions = Record<PermissionCollection, Record<Operation, boolean>>

const buildPermissions = (grant: (slug: PermissionCollection, op: Operation) => boolean): Permissions =>
  Object.fromEntries(
    PERMISSION_COLLECTIONS.map(({ slug }) => [
      slug,
      Object.fromEntries(OPERATIONS.map((op) => [op, grant(slug, op)])),
    ]),
  ) as Permissions

const NO_PERMISSIONS = buildPermissions(() => false)
const ALL_PERMISSIONS = buildPermissions(() => true)
/** What a site admin without custom roles has always had: business data, not users */
const SITE_ADMIN_PERMISSIONS = buildPermissions((slug) => slug !== 'users')

const idOf = (v: unknown): number | string | undefined =>
  v && typeof v === 'object' ? (v as { id?: number | string }).id : (v as number | string | undefined)

/**
 * Effective permissions of a user record: built-in role first, then custom roles.
 * `customRoles` may be IDs or populated docs; role docs are re-read so edits apply at once.
 */
export async function permissionsFor(
  req: PayloadRequest,
  user: { role?: string | null; customRoles?: unknown } | null | undefined,
): Promise<Permissions> {
  if (!user) return NO_PERMISSIONS
  if (user.role === 'super-admin') return ALL_PERMISSIONS
  const ids = (Array.isArray(user.customRoles) ? user.customRoles : [])
    .map(idOf)
    .filter((id) => id != null)
  if (ids.length === 0) return SITE_ADMIN_PERMISSIONS
  const { docs } = await req.payload.find({
    collection: 'roles',
    where: { id: { in: ids } },
    depth: 0,
    limit: ids.length,
    pagination: false,
    overrideAccess: true,
    req,
  })
  return buildPermissions((slug, op) =>
    docs.some((doc) => Boolean((doc.permissions as Partial<Permissions> | undefined)?.[slug]?.[op])),
  )
}

// Access functions run many times per request (list views, relationships), so
// memoise the logged-in user's permissions on the request object
const requestCache = new WeakMap<PayloadRequest, Promise<Permissions>>()

export function currentPermissions(req: PayloadRequest): Promise<Permissions> {
  if (!isStaff(req.user)) return Promise.resolve(NO_PERMISSIONS)
  let cached = requestCache.get(req)
  if (!cached) {
    cached = permissionsFor(req, req.user as { role?: string; customRoles?: unknown })
    requestCache.set(req, cached)
  }
  return cached
}

export async function can(
  req: PayloadRequest,
  collection: PermissionCollection,
  op: Operation,
): Promise<boolean> {
  if (isSuperAdmin(req.user)) return true
  return (await currentPermissions(req))[collection][op]
}

/** True when every permission in `inner` is also granted by `outer`. */
export const isSubset = (inner: Permissions, outer: Permissions): boolean =>
  PERMISSION_COLLECTIONS.every(({ slug }) => OPERATIONS.every((op) => !inner[slug][op] || outer[slug][op]))

/** CRUD access evaluated against the user's role permissions for one collection. */
export const roleCrud = (collection: PermissionCollection) => ({
  read: (({ req }) => can(req, collection, 'read')) as Access,
  create: (({ req }) => can(req, collection, 'create')) as Access,
  update: (({ req }) => can(req, collection, 'update')) as Access,
  delete: (({ req }) => can(req, collection, 'delete')) as Access,
})
