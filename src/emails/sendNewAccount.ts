import type { Payload } from 'payload'
import { getTransporter } from './transporter'
import { buildWelcomeHtml } from './templates'

export async function sendNewAccount(
  payload: Payload,
  opts: { firstName: string; email: string; tempPassword: string },
) {
  const transporter = getTransporter()
  if (!transporter) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = (await payload.findGlobal({ slug: 'email-settings' })) as any
  const from = `"${settings?.fromName ?? 'Neighbourhood Art Studios'}" <${settings?.fromAddress ?? 'noreply@neighbourhoodartstudios.com'}>`
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://neighbourhoodartstudios.com'

  const html = buildWelcomeHtml({
    intro: settings?.welcomeIntro ?? 'An account has been created for you. Use the temporary password below to log in.',
    firstName: opts.firstName,
    email: opts.email,
    tempPassword: opts.tempPassword,
    loginUrl: `${base}/account/login`,
  })

  await transporter.sendMail({
    from,
    to: opts.email,
    subject: settings?.welcomeSubject ?? 'Your account – Neighbourhood Art Studios',
    html,
  })
}
