import type { CollectionConfig, PayloadRequest } from 'payload'
import { Forbidden } from 'payload'
import {
  can,
  currentPermissions,
  isStaff,
  isSubset,
  isSuperAdmin,
  permissionsFor,
  superAdmin,
  superAdminField,
} from '../access'

const sameIds = (a: unknown, b: unknown): boolean => {
  const ids = (v: unknown) =>
    (Array.isArray(v) ? v : [])
      .map((x) => String(x && typeof x === 'object' ? (x as { id: unknown }).id : x))
      .sort()
      .join(',')
  return ids(a) === ids(b)
}

/**
 * Non-super-admins who manage users (via a custom role) must not be able to escalate:
 * no touching super admins, no granting or editing anyone with more access than
 * they have themselves, and no changing their own custom roles.
 */
async function assertCanManage(
  req: PayloadRequest,
  target: { id?: number | string; role?: string | null; customRoles?: unknown },
) {
  if (isSuperAdmin(req.user)) return
  if (target.role === 'super-admin') throw new Forbidden(req.t)
  const mine = await currentPermissions(req)
  if (!isSubset(await permissionsFor(req, target), mine)) throw new Forbidden(req.t)
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'System / Users',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'customRoles', 'updatedAt'],
  },
  access: {
    admin: ({ req }) => isStaff(req.user),
    // Everyone can see and edit their own account (email/password); the rest needs
    // the Users permission from a role
    read: async ({ req }) => {
      if (await can(req, 'users', 'read')) return true
      return isStaff(req.user) ? { id: { equals: req.user!.id } } : false
    },
    create: ({ req }) => can(req, 'users', 'create'),
    update: async ({ req }) => {
      if (await can(req, 'users', 'update')) return true
      return isStaff(req.user) ? { id: { equals: req.user!.id } } : false
    },
    delete: async ({ req }) => {
      if (isSuperAdmin(req.user)) return true
      if (await can(req, 'users', 'delete')) return { id: { not_equals: req.user!.id } }
      return false
    },
    unlock: superAdmin,
  },
  hooks: {
    beforeChange: [
      // The very first account (create-first-user screen) must be able to manage roles
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) data.role = 'super-admin'
        return data
      },
      async ({ data, originalDoc, operation, req }) => {
        if (!req.user || isSuperAdmin(req.user)) return data
        const isSelf = operation === 'update' && originalDoc?.id === req.user.id
        if (isSelf) {
          if ('customRoles' in data && !sameIds(data.customRoles, originalDoc?.customRoles)) {
            throw new Forbidden(req.t)
          }
          return data
        }
        if (operation === 'update') await assertCanManage(req, originalDoc)
        await assertCanManage(req, { ...originalDoc, ...data })
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        if (!req.user || isSuperAdmin(req.user)) return
        const target = await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true, req })
        await assertCanManage(req, target)
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'site-admin',
      saveToJWT: true,
      options: [
        { label: 'Super Administrator', value: 'super-admin' },
        { label: 'Site Administrator (Business Owner)', value: 'site-admin' },
      ],
      access: {
        create: superAdminField,
        update: superAdminField,
        read: ({ req }) => isStaff(req.user),
      },
      admin: {
        position: 'sidebar',
        description: 'Super Administrators manage users, roles and system settings (payments, email).',
      },
    },
    {
      name: 'customRoles',
      label: 'Custom Roles',
      type: 'relationship',
      relationTo: 'roles',
      hasMany: true,
      access: {
        read: ({ req }) => isStaff(req.user),
      },
      admin: {
        position: 'sidebar',
        description:
          'Site admins only. Leave empty for full site-admin access; otherwise their access to every collection comes from these roles (system settings stay super-admin only).',
        condition: (data) => data?.role !== 'super-admin',
      },
    },
  ],
}
