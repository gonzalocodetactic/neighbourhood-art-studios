import type { Payload } from 'payload'
import { getTransporter } from './transporter'
import { buildAdminNotificationHtml } from './templates'

export async function sendFailedOrder(
  payload: Payload,
  opts: {
    monerisOrderId: string
    registrationId?: string | number
    parentEmail?: string
    parentName?: string
  },
) {
  const transporter = getTransporter()
  if (!transporter) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = (await payload.findGlobal({ slug: 'email-settings' })) as any
  const adminRecipients: string = settings?.adminRecipients ?? ''
  if (!adminRecipients.trim()) return

  const from = `"${settings?.fromName ?? 'Neighbourhood Art Studios'}" <${settings?.fromAddress ?? 'noreply@neighbourhoodartstudios.com'}>`
  const html = buildAdminNotificationHtml({
    title: 'FAILED / Declined Order',
    rows: [
      { label: 'Moneris Order ID', value: opts.monerisOrderId },
      { label: 'Registration ID', value: opts.registrationId ? String(opts.registrationId) : '—' },
      { label: 'Parent Email', value: opts.parentEmail ?? '—' },
      { label: 'Parent Name', value: opts.parentName ?? '—' },
    ],
  })

  await transporter.sendMail({
    from,
    to: adminRecipients,
    subject: settings?.failedAdminSubject ?? 'FAILED order – Neighbourhood Art Studios',
    html,
  })
}
