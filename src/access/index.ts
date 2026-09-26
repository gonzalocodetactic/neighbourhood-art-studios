import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Two admin roles, stored on the `users` collection:
 *   super-admin — everything, including user/role management and system settings
 *                 (payment gateway, email delivery).
 *   site-admin  — day-to-day business: registrations, products & variations,
 *                 schools, seasons, parents, content, analytics and the roster.
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

/** Super admins see all users; site admins only their own account. */
export const superAdminOrSelf: Access = ({ req: { user } }) => {
  if (isSuperAdmin(user)) return true
  if (isStaff(user)) return { id: { equals: user!.id } }
  return false
}

export const superAdminField: FieldAccess = ({ req }) => isSuperAdmin(req.user)

/** Full CRUD for staff (both roles). */
export const staffCrud = { read: staff, create: staff, update: staff, delete: staff }
