import type { Payload } from 'payload'
import { getTransporter } from './transporter'
import { buildWaitlistInviteHtml } from './templates'

type Rel = number | string | { id: number | string; title?: string } | null | undefined

async function titleOf(payload: Payload, collection: 'products' | 'schools' | 'seasons', rel: Rel): Promise<string> {
  if (!rel) return ''
  if (typeof rel === 'object' && rel.title) return rel.title
  const id = typeof rel === 'object' ? rel.id : rel
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = (await payload.findByID({ collection, id, depth: 0 })) as any
    return doc?.title ?? ''
  } catch {
    return ''
  }
}

export async function sendWaitlistInvite(
  payload: Payload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: any,
) {
  const transporter = getTransporter()
  if (!transporter || !entry.parentEmail) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = (await payload.findGlobal({ slug: 'email-settings' })) as any
  const from = `"${settings?.fromName ?? 'Neighbourhood Art Studios'}" <${settings?.fromAddress ?? 'noreply@neighbourhoodartstudios.com'}>`
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://neighbourhoodartstudios.com'
  const registerUrl = `${base}/register`

  const [program, school, season] = await Promise.all([
    titleOf(payload, 'products', entry.product),
    titleOf(payload, 'schools', entry.school),
    titleOf(payload, 'seasons', entry.season),
  ])
  const students: string[] = (entry.students ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => [s.firstName, s.lastName].filter(Boolean).join(' '))
    .filter(Boolean)

  const heading = settings?.waitlistInviteHeading ?? 'A Spot Has Opened Up!'
  const intro = settings?.waitlistInviteIntro ?? 'A spot has opened up in the program you joined the waitlist for. Use the button below to register and claim it.'
  const footer = settings?.regParentFooter ?? 'If you have any questions, please call us at (604) 536-7900 or reply to this email.'

  const html = buildWaitlistInviteHtml({
    heading,
    intro,
    parentName: entry.parentName,
    students,
    program,
    school,
    season,
    registerUrl,
    footer,
  })

  const details = [
    program && `Program: ${program}`,
    school && `School: ${school}`,
    season && `Season: ${season}`,
    students.length && `Student(s): ${students.join(', ')}`,
  ].filter(Boolean).join('\n')

  await transporter.sendMail({
    from,
    replyTo: from,
    to: entry.parentEmail,
    subject: settings?.waitlistInviteSubject ?? 'A spot has opened up – Neighbourhood Art Studios',
    html,
    text: `${heading}\n\nHi ${entry.parentName},\n\n${intro}\n\n${details}\n\nRegister at: ${registerUrl}\n\n${footer}`,
  })
}
