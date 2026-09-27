import type { ServerProps } from 'payload'
import { createLocalReq } from 'payload'
import { can } from '@/access'
import { AnalyticsNavLinkClient } from './AnalyticsNavLinkClient'

export async function AnalyticsNavLink({ payload, user }: ServerProps) {
  if (!user) return null
  const req = await createLocalReq({ user }, payload)
  return (await can(req, 'analytics', 'read')) ? <AnalyticsNavLinkClient /> : null
}
