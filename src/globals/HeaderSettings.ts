import type { GlobalConfig } from 'payload'

export const HeaderSettings: GlobalConfig = {
  slug: 'header-settings',
  label: 'Header Settings',
  admin: { group: 'Settings' },
  fields: [
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
    {
      name: 'mainMenuItems',
      type: 'array',
      label: 'Main Menu Items',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            { name: 'url', type: 'text', label: 'URL', admin: { placeholder: '/about' } },
            { name: 'page', type: 'relationship', relationTo: 'pages', label: 'Page (optional)' },
          ],
        },
      ],
    },
    {
      name: 'sidebarMenuItems',
      type: 'array',
      label: 'Left Sidebar Menu Items',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'icon', type: 'text', label: 'Icon', admin: { placeholder: '🎨' } },
        {
          type: 'row',
          fields: [
            { name: 'url', type: 'text', label: 'URL', admin: { placeholder: '/programs' } },
            { name: 'page', type: 'relationship', relationTo: 'pages', label: 'Page (optional)' },
          ],
        },
      ],
    },
  ],
}
