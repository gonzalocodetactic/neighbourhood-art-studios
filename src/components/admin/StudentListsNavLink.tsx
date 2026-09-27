import type { ServerProps } from 'payload'
import { createLocalReq } from 'payload'
import { can } from '@/access'
import { StudentListsNavLinkClient } from './StudentListsNavLinkClient'

export async function StudentListsNavLink({ payload, user }: ServerProps) {
  if (!user) return null
  const req = await createLocalReq({ user }, payload)
  return (await can(req, 'registrations', 'read')) ? <StudentListsNavLinkClient /> : null
}
