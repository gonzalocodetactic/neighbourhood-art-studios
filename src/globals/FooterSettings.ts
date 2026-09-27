import type { GlobalConfig } from 'payload'
import { roleGlobal } from '../access'

export const FooterSettings: GlobalConfig = {
  slug: 'footer-settings',
  access: roleGlobal('footerSettings'),
  label: 'Footer Settings',
  admin: { group: 'Settings' },
  fields: [
    // ── Column 1: Logo ──────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
        {
          name: 'logoMaxWidth',
          type: 'number',
          label: 'Logo Max Width (px)',
          defaultValue: 120,
          admin: { description: 'Display width of the footer logo (pixels).' },
        },
      ],
    },

    // ── Column 2: Navigator ─────────────────────────────────────────────────
    {
      name: 'navLinks',
      type: 'array',
      label: 'Navigator Links',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          type: 'row',
          fields: [
            { name: 'url', type: 'text', label: 'URL', admin: { placeholder: '/about' } },
            {
              name: 'page',
              type: 'relationship',
              relationTo: 'pages',
              label: 'Page (optional)',
            },
          ],
        },
      ],
    },

    // ── Column 3: Contact Us ────────────────────────────────────────────────
    {
      name: 'contactHeading',
      type: 'text',
      label: 'Contact Heading',
      defaultValue: 'CONTACT US',
    },
    { name: 'location', type: 'text', label: 'Location' },
    { name: 'phone', type: 'text', label: 'Phone Number' },
    { name: 'email', type: 'email', label: 'Email Address' },

    // ── Column 4: Connect With Us ───────────────────────────────────────────
    {
      name: 'socialHeading',
      type: 'text',
      label: 'Social Heading',
      defaultValue: 'CONNECT WITH US',
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Links',
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Platform Name' },
        { name: 'url', type: 'text', required: true, label: 'URL' },
        {
          name: 'icon',
          type: 'select',
          label: 'Icon',
          defaultValue: 'link',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Link (generic)', value: 'link' },
          ],
        },
      ],
    },

    // ── Bottom Bar ──────────────────────────────────────────────────────────
    {
      name: 'copyrightText',
      type: 'text',
      label: 'Copyright Text',
      defaultValue: '© 2026 Neighbourhood Art Studios',
    },
    {
      name: 'creditText',
      type: 'text',
      label: 'Credit / Subtext',
      defaultValue: 'Designed by GoodTactic Media Co | Web Design | All rights reserved',
    },
  ],
}
