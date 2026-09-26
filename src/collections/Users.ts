import type { CollectionConfig } from 'payload'
import { isStaff, superAdmin, superAdminField, superAdminOrSelf } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    group: 'System / Users',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'updatedAt'],
  },
  access: {
    admin: ({ req }) => isStaff(req.user),
    read: superAdminOrSelf,
    create: superAdmin,
    // Site admins can change their own email/password; the role field is locked below
    update: superAdminOrSelf,
    delete: superAdmin,
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
  ],
}
