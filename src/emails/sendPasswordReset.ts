import type { Payload } from 'payload'
import { getTransporter } from './transporter'
import { buildPasswordResetHtml } from './templates'

export async function sendPasswordReset(
  payload: Payload,
  opts: { email: string; resetToken: string },
) {
  const transporter = getTransporter()
  if (!transporter) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = (await payload.findGlobal({ slug: 'email-settings' })) as any
  const from = `"${settings?.fromName ?? 'Neighbourhood Art Studios'}" <${settings?.fromAddress ?? 'noreply@neighbourhoodartstudios.com'}>`
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://neighbourhoodartstudios.com'
  const resetUrl = `${base}/account/reset-password?token=${opts.resetToken}`

  const html = buildPasswordResetHtml({
    intro: settings?.resetIntro ?? 'Click the button below to reset your password.',
    resetUrl,
  })

  await transporter.sendMail({
    from,
    to: opts.email,
    subject: settings?.resetSubject ?? 'Reset your password – Neighbourhood Art Studios',
    html,
  })
}
