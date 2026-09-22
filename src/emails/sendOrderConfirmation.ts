import type { Payload } from 'payload'
import { getTransporter } from './transporter'
import { buildOrderConfirmationHtml, buildAdminNotificationHtml, formatCents } from './templates'

type RegistrationData = {
  id: number | string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  productTitle?: string
  schoolName?: string
  seasonName?: string
  students: Array<{ firstName: string; lastName?: string }>
  unitPrice: number
  studentCount: number
  subtotal: number
  gstAmount: number
  totalAmount: number
}

export async function sendOrderConfirmation(payload: Payload, reg: RegistrationData) {
  const transporter = getTransporter()
  if (!transporter) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = (await payload.findGlobal({ slug: 'email-settings' })) as any
  const from = `"${settings?.fromName ?? 'Neighbourhood Art Studios'}" <${settings?.fromAddress ?? 'noreply@neighbourhoodartstudios.com'}>`

  const parentHtml = buildOrderConfirmationHtml({
    heading: settings?.regParentHeading ?? 'Registration Confirmed!',
    intro: settings?.regParentIntro ?? 'Thank you for registering.',
    footer: settings?.regParentFooter ?? 'Call us at (604) 536-7900 with any questions.',
    parentName: `${reg.parentFirstName} ${reg.parentLastName}`,
    productTitle: reg.productTitle ?? 'Art Program',
    schoolName: reg.schoolName ?? '',
    seasonName: reg.seasonName ?? '',
    students: reg.students.map((s) => `${s.firstName}${s.lastName ? ' ' + s.lastName : ''}`),
    unitPrice: reg.unitPrice,
    studentCount: reg.studentCount,
    subtotal: reg.subtotal,
    gstAmount: reg.gstAmount,
    totalAmount: reg.totalAmount,
  })

  await transporter.sendMail({
    from,
    to: reg.parentEmail,
    subject: settings?.regParentSubject ?? 'Your registration is confirmed – Neighbourhood Art Studios',
    html: parentHtml,
  })

  const adminRecipients: string = settings?.adminRecipients ?? ''
  if (adminRecipients.trim()) {
    const adminHtml = buildAdminNotificationHtml({
      title: 'New Registration',
      rows: [
        { label: 'Parent', value: `${reg.parentFirstName} ${reg.parentLastName}` },
        { label: 'Email', value: reg.parentEmail },
        { label: 'Phone', value: reg.parentPhone },
        { label: 'Product', value: reg.productTitle ?? '' },
        { label: 'School', value: reg.schoolName ?? '' },
        { label: 'Season', value: reg.seasonName ?? '' },
        { label: 'Students', value: reg.studentCount.toString() },
        { label: 'Total', value: formatCents(reg.totalAmount) },
        { label: 'Registration ID', value: String(reg.id) },
      ],
    })
    await transporter.sendMail({
      from,
      to: adminRecipients,
      subject: settings?.regAdminSubject ?? 'New registration received – Neighbourhood Art Studios',
      html: adminHtml,
    })
  }
}
