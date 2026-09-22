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

export function buildOrderConfirmationHtml(opts: {
  heading: string
  intro: string
  footer: string
  parentName: string
  productTitle: string
  schoolName: string
  seasonName: string
  students: string[]
  unitPrice: number
  studentCount: number
  subtotal: number
  gstAmount: number
  totalAmount: number
}): string {
  const studentRows = opts.students
    .map((name) => `<tr><td style="padding:4px 0;font-size:14px;color:#374151;">· ${name}</td></tr>`)
    .join('')

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#3B4BC8;">${opts.heading}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">Hi ${opts.parentName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;">${opts.intro}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Order Summary</td>
      </tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-weight:600;">Program</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${opts.productTitle}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-weight:600;">School</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${opts.schoolName}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-weight:600;">Season</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${opts.seasonName}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-weight:600;vertical-align:top;">Students</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">
            <table cellpadding="0" cellspacing="0">${studentRows}</table>
          </td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-weight:600;">Price / student</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${formatCents(opts.unitPrice)}</td></tr>
      <tr><td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-weight:600;">Subtotal</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${formatCents(opts.subtotal)}</td></tr>
      ${opts.gstAmount > 0 ? `<tr><td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;font-weight:600;">GST</td>
          <td style="padding:10px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${formatCents(opts.gstAmount)}</td></tr>` : ''}
      <tr style="background:#f0f3ff;"><td style="padding:12px 16px;font-size:15px;color:#3B4BC8;border-top:1px solid #e5e7eb;font-weight:700;">Total</td>
          <td style="padding:12px 16px;font-size:15px;color:#3B4BC8;border-top:1px solid #e5e7eb;font-weight:700;">${formatCents(opts.totalAmount)}</td></tr>
    </table>

    <p style="margin:0;font-size:14px;color:#6b7280;">${opts.footer}</p>
  `
  return wrap(content)
}

export function buildAdminNotificationHtml(opts: {
  title: string
  rows: Array<{ label: string; value: string }>
}): string {
  const tableRows = opts.rows
    .map(
      (r) => `<tr>
        <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#374151;border-top:1px solid #e5e7eb;width:40%;">${r.label}</td>
        <td style="padding:8px 16px;font-size:14px;color:#374151;border-top:1px solid #e5e7eb;">${r.value}</td>
      </tr>`,
    )
    .join('')

  const content = `
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#3B4BC8;">${opts.title}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Details</td>
      </tr>
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
