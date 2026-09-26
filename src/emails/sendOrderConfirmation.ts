import type { Payload } from 'payload'
import { getTransporter } from './transporter'
import { buildOrderConfirmationHtml, buildAdminNotificationHtml, formatCents, type ConfirmationStudent } from './templates'

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

export type RegistrationData = {
  id: number | string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  emergencyContactFirstName?: string
  emergencyContactLastName?: string
  emergencyContactPhone?: string
  emergencyContactEmail?: string
  orderId?: string
  productTitle?: string
  schoolName?: string
  seasonName?: string
  locationName?: string
  timeslotLabel?: string
  campWeekLabel?: string
  paymentStatus?: string
  students: StudentDetail[]
  unitPrice: number
  studentCount: number
  subtotal: number
  gstAmount: number
  totalAmount: number
}

/** Contact summary at the top of the admin notification: parent full name, phone, email. */
export function buildAdminContactRows(
  reg: Pick<RegistrationData, 'parentFirstName' | 'parentLastName' | 'parentPhone' | 'parentEmail'>,
): Array<{ label: string; value: string; section?: true }> {
  return [
    { label: 'Contact', value: '', section: true },
    { label: 'Parent Name', value: `${reg.parentFirstName} ${reg.parentLastName}`.trim() },
    { label: 'Phone', value: reg.parentPhone },
    { label: 'Email', value: reg.parentEmail },
  ]
}

const label = (v: unknown, key: string): string =>
  v && typeof v === 'object' ? String((v as Record<string, unknown>)[key] ?? '') : ''

/**
 * Build the email payload from a registration doc (fetched at depth >= 1).
 * Camp registrations carry a campVariationId; the matching variation on the
 * product supplies Location / Timeslot / Camp Week.
 */
export async function toEmailRegistration(
  payload: Payload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullReg: any,
): Promise<RegistrationData> {
  let locationName = ''
  let timeslotLabel = ''
  let campWeekLabel = ''

  if (fullReg.campVariationId) {
    const productId = typeof fullReg.product === 'object' ? fullReg.product?.id : fullReg.product
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = (await payload.findByID({ collection: 'products', id: productId, depth: 1 })) as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (product?.variations ?? []).find((x: any) => String(x.id) === String(fullReg.campVariationId))
    locationName = label(v?.location, 'name')
    timeslotLabel = label(v?.timeslot, 'label')
    campWeekLabel = label(v?.campWeek, 'label')
  }

  return {
    id: fullReg.id,
    orderId: fullReg.monerisOrderId || String(fullReg.id),
    parentFirstName: fullReg.parentFirstName ?? '',
    parentLastName: fullReg.parentLastName ?? '',
    parentEmail: fullReg.parentEmail ?? '',
    parentPhone: fullReg.parentPhone ?? '',
    emergencyContactFirstName: fullReg.emergencyContactFirstName || undefined,
    emergencyContactLastName: fullReg.emergencyContactLastName || undefined,
    emergencyContactPhone: fullReg.emergencyContactPhone || undefined,
    emergencyContactEmail: fullReg.emergencyContactEmail || undefined,
    productTitle: label(fullReg.product, 'title'),
    schoolName: label(fullReg.school, 'title'),
    seasonName: label(fullReg.season, 'title'),
    locationName,
    timeslotLabel,
    campWeekLabel,
    paymentStatus: fullReg.paymentStatus ?? 'pending',
    students: Array.isArray(fullReg.students) ? fullReg.students : [],
    unitPrice: fullReg.unitPrice ?? 0,
    studentCount: fullReg.studentCount ?? 0,
    subtotal: fullReg.subtotal ?? 0,
    gstAmount: fullReg.gstAmount ?? 0,
    totalAmount: fullReg.totalAmount ?? 0,
  }
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
  const isCamp = Boolean(reg.locationName || reg.timeslotLabel || reg.campWeekLabel)
  const orderId = reg.orderId ?? String(reg.id)
  const variation = isCamp
    ? [reg.campWeekLabel, reg.timeslotLabel, reg.locationName].filter(Boolean).join(' · ')
    : [reg.schoolName, reg.seasonName].filter(Boolean).join(' · ')
  const students: ConfirmationStudent[] = reg.students.map((s) => ({
    name: `${s.firstName}${s.lastName ? ' ' + s.lastName : ''}`,
    detail: [s.age ? `Age ${s.age}` : '', s.grade ? `Grade ${s.grade}` : ''].filter(Boolean).join(' · '),
    variation: [reg.productTitle, variation].filter(Boolean).join(' — '),
  }))
  const studentNames = students.map((s) => s.name)

  const parentHtml = buildOrderConfirmationHtml({
    heading: settings?.regParentHeading ?? 'Registration Confirmed!',
    intro: settings?.regParentIntro ?? 'Thank you for registering.',
    footer: settings?.regParentFooter ?? 'Call us at (604) 536-7900 with any questions.',
    parentName,
    orderId,
    productTitle: reg.productTitle ?? 'Art Program',
    programKind: isCamp ? 'camp' : 'school',
    schoolName: reg.schoolName ?? '',
    seasonName: reg.seasonName ?? '',
    locationName: reg.locationName ?? '',
    timeslotLabel: reg.timeslotLabel ?? '',
    campWeekLabel: reg.campWeekLabel ?? '',
    students,
    unitPrice: reg.unitPrice,
    studentCount: reg.studentCount,
    subtotal: reg.subtotal,
    gstAmount: reg.gstAmount,
    totalAmount: reg.totalAmount,
    paymentStatus: reg.paymentStatus ?? 'pending',
  })

  const parentText = [
    `Registration Confirmed – Neighbourhood Art Studios`,
    ``,
    `Hi ${parentName},`,
    `${settings?.regParentIntro ?? 'Thank you for registering.'}`,
    ``,
    `Order Reference: ${orderId}`,
    `Program: ${reg.productTitle ?? 'Art Program'}`,
    ...(isCamp
      ? [`Location:  ${reg.locationName ?? ''}`, `Timeslot:  ${reg.timeslotLabel ?? ''}`, `Camp Week: ${reg.campWeekLabel ?? ''}`]
      : [`School:  ${reg.schoolName ?? ''}`, `Season:  ${reg.seasonName ?? ''}`]),
    `Students:`,
    ...students.map((st) => `  - ${st.name}${st.detail ? ` (${st.detail})` : ''}${st.variation ? ` – ${st.variation}` : ''}`),
    `Price / student: ${formatCents(reg.unitPrice)}`,
    `Subtotal: ${formatCents(reg.subtotal)}`,
    ...(reg.gstAmount > 0 ? [`GST:      ${formatCents(reg.gstAmount)}`] : []),
    `Total:    ${formatCents(reg.totalAmount)}`,
    `Payment Status: ${reg.paymentStatus === 'paid' ? 'Paid' : 'Pending'}`,
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

    const rows: Array<{ label: string; value: string; section?: true }> = buildAdminContactRows(reg)

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

    rows.push({ label: 'Order', value: orderId, section: true })
    rows.push({ label: 'Product', value: reg.productTitle ?? '' })
    if (isCamp) {
      rows.push({ label: 'Location', value: reg.locationName ?? '' })
      rows.push({ label: 'Timeslot', value: reg.timeslotLabel ?? '' })
      rows.push({ label: 'Camp Week', value: reg.campWeekLabel ?? '' })
    } else {
      rows.push({ label: 'School', value: reg.schoolName ?? '' })
      rows.push({ label: 'Season', value: reg.seasonName ?? '' })
    }
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
