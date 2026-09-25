import type { Payload } from 'payload'
import { getTransporter } from './transporter'
import { buildOrderConfirmationHtml, buildAdminNotificationHtml, formatCents } from './templates'

type StudentDetail = {
  firstName: string
  lastName?: string
  age?: string
  grade?: string
  gender?: string
  medicalNotes?: string
  teacherName?: string
  divisionNumber?: string
}

type RegistrationData = {
  id: number | string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  emergencyContactFirstName?: string
  emergencyContactLastName?: string
  emergencyContactPhone?: string
  emergencyContactEmail?: string
  productTitle?: string
  schoolName?: string
  seasonName?: string
  students: StudentDetail[]
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
  const fromName = settings?.fromName ?? 'Neighbourhood Art Studios'
  const fromAddress = settings?.fromAddress ?? 'noreply@neighbourhoodartstudios.com'
  const from = `"${fromName}" <${fromAddress}>`
  const replyTo = `"${fromName}" <info@neighbourhoodartstudios.com>`

  const parentName = `${reg.parentFirstName} ${reg.parentLastName}`
  const studentNames = reg.students.map(
    (s) => `${s.firstName}${s.lastName ? ' ' + s.lastName : ''}`,
  )

  const parentHtml = buildOrderConfirmationHtml({
    heading: settings?.regParentHeading ?? 'Registration Confirmed!',
    intro: settings?.regParentIntro ?? 'Thank you for registering.',
    footer: settings?.regParentFooter ?? 'Call us at (604) 536-7900 with any questions.',
    parentName,
    productTitle: reg.productTitle ?? 'Art Program',
    schoolName: reg.schoolName ?? '',
    seasonName: reg.seasonName ?? '',
    students: studentNames,
    unitPrice: reg.unitPrice,
    studentCount: reg.studentCount,
    subtotal: reg.subtotal,
    gstAmount: reg.gstAmount,
    totalAmount: reg.totalAmount,
  })

  const parentText = [
    `Registration Confirmed – Neighbourhood Art Studios`,
    ``,
    `Hi ${parentName},`,
    `${settings?.regParentIntro ?? 'Thank you for registering.'}`,
    ``,
    `Program: ${reg.productTitle ?? 'Art Program'}`,
    `School:  ${reg.schoolName ?? ''}`,
    `Season:  ${reg.seasonName ?? ''}`,
    `Students: ${studentNames.join(', ')}`,
    `Subtotal: ${formatCents(reg.subtotal)}`,
    ...(reg.gstAmount > 0 ? [`GST:      ${formatCents(reg.gstAmount)}`] : []),
    `Total:    ${formatCents(reg.totalAmount)}`,
    ``,
    settings?.regParentFooter ?? 'Call us at (604) 536-7900 with any questions.',
  ].join('\n')

  await transporter.sendMail({
    from,
    replyTo,
    to: reg.parentEmail,
    subject: settings?.regParentSubject ?? 'Your registration is confirmed – Neighbourhood Art Studios',
    html: parentHtml,
    text: parentText,
  })

  const adminRecipients: string = settings?.adminRecipients ?? ''
  if (adminRecipients.trim()) {
    const ecName = [reg.emergencyContactFirstName, reg.emergencyContactLastName]
      .filter(Boolean)
      .join(' ')

    const rows: Array<{ label: string; value: string; section?: true }> = [
      { label: 'Parent', value: parentName, section: true },
      { label: 'Email', value: reg.parentEmail },
      { label: 'Phone', value: reg.parentPhone },
    ]

    if (ecName || reg.emergencyContactPhone || reg.emergencyContactEmail) {
      rows.push({ label: 'Emergency Contact', value: ecName || '—', section: true })
      if (reg.emergencyContactPhone) rows.push({ label: 'EC Phone', value: reg.emergencyContactPhone })
      if (reg.emergencyContactEmail) rows.push({ label: 'EC Email', value: reg.emergencyContactEmail })
    }

    reg.students.forEach((s, i) => {
      const name = `${s.firstName}${s.lastName ? ' ' + s.lastName : ''}`
      rows.push({ label: `Student ${i + 1}`, value: name, section: true })
      if (s.age) rows.push({ label: 'Age', value: s.age })
      if (s.grade) rows.push({ label: 'Grade', value: s.grade })
      if (s.gender) rows.push({ label: 'Gender', value: s.gender })
      if (s.teacherName) rows.push({ label: 'Teacher', value: s.teacherName })
      if (s.divisionNumber) rows.push({ label: 'Division', value: s.divisionNumber })
      if (s.medicalNotes) rows.push({ label: 'Medical Notes', value: s.medicalNotes })
    })

    rows.push({ label: 'Order', value: String(reg.id), section: true })
    rows.push({ label: 'Product', value: reg.productTitle ?? '' })
    rows.push({ label: 'School', value: reg.schoolName ?? '' })
    rows.push({ label: 'Season', value: reg.seasonName ?? '' })
    rows.push({ label: 'Students', value: String(reg.studentCount) })
    rows.push({ label: 'Subtotal', value: formatCents(reg.subtotal) })
    if (reg.gstAmount > 0) rows.push({ label: 'GST', value: formatCents(reg.gstAmount) })
    rows.push({ label: 'Total', value: formatCents(reg.totalAmount) })

    const adminHtml = buildAdminNotificationHtml({ title: 'New Registration', rows })

    const adminText = rows
      .map((r) => (r.section ? `\n── ${r.label} ──\n` : `${r.label}: ${r.value}`))
      .join('\n')

    await transporter.sendMail({
      from,
      replyTo: `"${parentName}" <${reg.parentEmail}>`,
      to: adminRecipients,
      subject: settings?.regAdminSubject ?? 'New registration received – Neighbourhood Art Studios',
      html: adminHtml,
      text: `New Registration\n\n${adminText}`,
    })
  }
}
