import type { CollectionConfig } from 'payload'
import { OPERATIONS, PERMISSION_COLLECTIONS, staff, superAdmin } from '../access'

export const Roles: CollectionConfig = {
  slug: 'roles',
  // Anyone who can assign roles needs to list them; only super admins define them,
  // since a role's permissions are what every assigned user can do
  access: { read: staff, create: superAdmin, update: superAdmin, delete: superAdmin },
  admin: {
    group: 'Settings',
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'updatedAt'],
    description:
      'Custom roles for site administrators. A site admin with one or more roles gets exactly the permissions ticked here (combined across roles).',
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'permissions',
      type: 'group',
      fields: PERMISSION_COLLECTIONS.map((entry) => ({
        name: entry.key,
        label: entry.label,
        type: 'group' as const,
        fields: [
          {
            type: 'row' as const,
            fields: ('ops' in entry ? entry.ops : OPERATIONS).map((op) => ({
              name: op,
              type: 'checkbox' as const,
              defaultValue: false,
              label: op[0].toUpperCase() + op.slice(1),
            })),
          },
        ],
      })),
    },
  ],
}
