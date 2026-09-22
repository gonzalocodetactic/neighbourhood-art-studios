import type { BeforeDocumentControlsServerProps } from 'payload'
import { SendPasswordResetButtonClient } from './SendPasswordResetButtonClient'

export async function SendPasswordResetButton(props: BeforeDocumentControlsServerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { payload, id } = props as any
  if (!id) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parent = await payload.findByID({ collection: 'parents', id }).catch(() => null) as any
  if (!parent?.email) return null

  return <SendPasswordResetButtonClient email={parent.email} />
}

export default SendPasswordResetButton
