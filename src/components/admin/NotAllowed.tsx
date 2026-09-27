/** Shown by custom admin views when the user's role lacks the needed permission */
export function NotAllowed({ what }: { what: string }) {
  return (
    <div style={{ padding: '48px 60px' }}>
      <h1 style={{ marginBottom: 8 }}>Not allowed</h1>
      <p style={{ color: 'var(--theme-elevation-600)' }}>
        Your role doesn&apos;t include access to {what}. Ask a super administrator if you need it.
      </p>
    </div>
  )
}
