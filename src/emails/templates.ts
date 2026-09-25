export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

const BASE = `
  <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr><td style="background:#3B4BC8;padding:28px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Neighbourhood Art Studios</p>
          </td></tr>
          <tr><td style="padding:32px;">
            {{CONTENT}}
          </td></tr>
          <tr><td style="background:#f4f5f7;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#888;">&copy; {{YEAR}} Neighbourhood Art Studios · (604) 536-7900</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>
`

function wrap(content: string): string {
  return BASE.replace('{{CONTENT}}', content).replace('{{YEAR}}', String(new Date().getFullYear()))
}

function esc(value: string | number | undefined | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type ConfirmationStudent = {
  name: string
  /** e.g. "Age 9 · Grade 4" — empty when unknown */
  detail: string
  /** Registered product variation, e.g. "Week 1 (Jul 7–11) · 9:00 AM – 3:00 PM · Surrey Arts Centre" */
  variation: string
}

export function buildOrderConfirmationHtml(opts: {
  heading: string
  intro: string
  footer: string
  parentName: string
  orderId: string
  productTitle: string
  /** 'camp' shows Location / Timeslot / Camp Week; 'school' shows School / Season */
  programKind: 'school' | 'camp'
  schoolName: string
  seasonName: string
  locationName: string
  timeslotLabel: string
  campWeekLabel: string
  students: ConfirmationStudent[]
  unitPrice: number
  studentCount: number
  subtotal: number
  gstAmount: number
  totalAmount: number
  paymentStatus: 'paid' | 'pending' | string
}): string {
  const cell = 'padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;'
  const row = (label: string, value: string, valign = '') =>
    `<tr><td style="${cell}font-weight:600;${valign}">${label}</td><td style="${cell}">${value}</td></tr>`

  const programRows =
    opts.programKind === 'camp'
      ? [
          row('Location', esc(opts.locationName) || '—'),
          row('Timeslot', esc(opts.timeslotLabel) || '—'),
          row('Camp Week', esc(opts.campWeekLabel) || '—'),
        ].join('')
      : [row('School', esc(opts.schoolName) || '—'), row('Season', esc(opts.seasonName) || '—')].join('')

  const studentList = opts.students
    .map(
      (st) => `<tr><td style="padding:6px 0;font-size:14px;color:#374151;">
        <strong>${esc(st.name)}</strong>${st.detail ? ` <span style="color:#6b7280;">· ${esc(st.detail)}</span>` : ''}
        ${st.variation ? `<br><span style="font-size:12px;color:#6b7280;">${esc(st.variation)}</span>` : ''}
      </td></tr>`,
    )
    .join('')

  const gstRate = opts.subtotal > 0 ? Math.round((opts.gstAmount / opts.subtotal) * 100) : 0
  const gstRow =
    opts.gstAmount > 0 ? row(gstRate ? `GST (${gstRate}%)` : 'GST', formatCents(opts.gstAmount)) : ''

  const isPaid = opts.paymentStatus === 'paid'
  const statusBadge = `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;background:${
    isPaid ? '#dcfce7' : '#fef3c7'
  };color:${isPaid ? '#166534' : '#92400e'};">${isPaid ? 'Paid' : 'Pending'}</span>`

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#3B4BC8;">${esc(opts.heading)}</h1>
    <p style="margin:0 0 20px;font-size:14px;font-weight:600;color:#374151;">Order Reference: <span style="font-family:Menlo,Consolas,monospace;">${esc(opts.orderId)}</span></p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">Hi ${esc(opts.parentName)},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">${esc(opts.intro)}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Program Details</td>
      </tr>
      ${row('Program', esc(opts.productTitle))}
      ${programRows}
      ${row('Students', `<table cellpadding="0" cellspacing="0">${studentList}</table>`, 'vertical-align:top;')}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Order Summary</td>
      </tr>
      ${row('Price / student', formatCents(opts.unitPrice))}
      ${row('Students', String(opts.studentCount))}
      ${row('Subtotal', formatCents(opts.subtotal))}
      ${gstRow}
      <tr style="background:#f0f3ff;"><td style="padding:12px 16px;font-size:15px;color:#3B4BC8;border-top:1px solid #e5e7eb;font-weight:700;">Total</td>
          <td style="padding:12px 16px;font-size:15px;color:#3B4BC8;border-top:1px solid #e5e7eb;font-weight:700;">${formatCents(opts.totalAmount)}</td></tr>
      ${row('Payment Status', statusBadge)}
    </table>

    <p style="margin:0;font-size:14px;color:#6b7280;">${esc(opts.footer)}</p>
  `
  return wrap(content)
}

export function buildAdminNotificationHtml(opts: {
  title: string
  rows: Array<{ label: string; value: string; section?: true }>
}): string {
  const tableRows = opts.rows
    .map((r) =>
      r.section
        ? `<tr style="background:#f0f3ff;">
            <td colspan="2" style="padding:8px 16px;font-size:12px;font-weight:700;color:#3B4BC8;border-top:2px solid #e5e7eb;text-transform:uppercase;letter-spacing:0.06em;">${r.label}</td>
           </tr>`
        : `<tr>
            <td style="padding:7px 16px;font-size:13px;font-weight:600;color:#374151;border-top:1px solid #f3f4f6;width:38%;">${r.label}</td>
            <td style="padding:7px 16px;font-size:13px;color:#374151;border-top:1px solid #f3f4f6;">${r.value}</td>
           </tr>`,
    )
    .join('')

  const content = `
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#3B4BC8;">${opts.title}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      ${tableRows}
    </table>
  `
  return wrap(content)
}

export function buildWelcomeHtml(opts: {
  intro: string
  firstName: string
  email: string
  tempPassword: string
  loginUrl: string
}): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#3B4BC8;">Welcome, ${opts.firstName}!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">${opts.intro}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Your Login Details</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#374151;border-top:1px solid #e5e7eb;width:40%;">Email</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${opts.email}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;font-weight:600;color:#374151;border-top:1px solid #e5e7eb;">Temp Password</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-family:monospace;">${opts.tempPassword}</td></tr>
    </table>

    <p style="margin:0 0 24px;">
      <a href="${opts.loginUrl}" style="display:inline-block;background:#3B4BC8;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Sign In to Your Account</a>
    </p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">Please change your password after your first sign-in.</p>
  `
  return wrap(content)
}

export function buildPasswordResetHtml(opts: {
  intro: string
  resetUrl: string
}): string {
  const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#3B4BC8;">Password Reset</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">${opts.intro}</p>
    <p style="margin:0 0 24px;">
      <a href="${opts.resetUrl}" style="display:inline-block;background:#3B4BC8;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Reset Password</a>
    </p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you did not request a password reset, you can safely ignore this email.</p>
  `
  return wrap(content)
}
