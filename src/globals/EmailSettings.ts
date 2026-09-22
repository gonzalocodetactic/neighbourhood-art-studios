import type { GlobalConfig } from 'payload'

export const EmailSettings: GlobalConfig = {
  slug: 'email-settings',
  label: 'Email Settings',
  admin: { group: 'Settings' },
  fields: [
    {
      name: 'fromAddress',
      type: 'email',
      defaultValue: 'noreply@neighbourhoodartstudios.com',
      admin: { description: 'The "from" address for all outgoing emails.' },
    },
    {
      name: 'fromName',
      type: 'text',
      defaultValue: 'Neighbourhood Art Studios',
    },
    {
      name: 'adminRecipients',
      type: 'text',
      label: 'Admin Notification Emails',
      admin: { description: 'Comma-separated list of admin email addresses to receive order notifications.' },
    },
    {
      type: 'collapsible',
      label: 'New Registration — Parent Confirmation',
      fields: [
        { name: 'regParentSubject', type: 'text', defaultValue: 'Your registration is confirmed – Neighbourhood Art Studios' },
        { name: 'regParentHeading', type: 'text', defaultValue: 'Registration Confirmed!' },
        { name: 'regParentIntro', type: 'textarea', defaultValue: 'Thank you for registering with Neighbourhood Art Studios. Here is a summary of your order.' },
        { name: 'regParentFooter', type: 'textarea', defaultValue: 'If you have any questions, please call us at (604) 536-7900 or reply to this email.' },
      ],
    },
    {
      type: 'collapsible',
      label: 'New Registration — Admin Notification',
      fields: [
        { name: 'regAdminSubject', type: 'text', defaultValue: 'New registration received – Neighbourhood Art Studios' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Failed / Declined Order — Admin Notification',
      fields: [
        { name: 'failedAdminSubject', type: 'text', defaultValue: 'FAILED order – Neighbourhood Art Studios' },
      ],
    },
    {
      type: 'collapsible',
      label: 'New Account Welcome Email',
      fields: [
        { name: 'welcomeSubject', type: 'text', defaultValue: 'Your account – Neighbourhood Art Studios' },
        { name: 'welcomeIntro', type: 'textarea', defaultValue: 'An account has been created for you. Use the temporary password below to log in, then update your password in Account Settings.' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Password Reset Email',
      fields: [
        { name: 'resetSubject', type: 'text', defaultValue: 'Reset your password – Neighbourhood Art Studios' },
        { name: 'resetIntro', type: 'textarea', defaultValue: 'Click the button below to reset your password. This link expires in 1 hour.' },
      ],
    },
  ],
}
