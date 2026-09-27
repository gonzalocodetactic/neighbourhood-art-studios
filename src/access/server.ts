import { headers } from 'next/headers'
import { createLocalReq, type Payload } from 'payload'
import { can, type Operation, type PermissionCollection } from '.'

/**
 * For route handlers, server actions and pages outside Payload's access control:
 * does the signed-in admin's role allow this?
 */
export async function currentUserCan(
  payload: Payload,
  key: PermissionCollection,
  op: Operation,
): Promise<boolean> {
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return false
  return can(await createLocalReq({ user }, payload), key, op)
}
