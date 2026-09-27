'use client'

export function StudentListsNavLinkClient() {
  return (
    <div style={{ padding: '0 16px', marginTop: 4 }}>
      <a
        href="/student-lists"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 400,
          color: 'var(--theme-elevation-700)',
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
      >
        Student Lists
      </a>
    </div>
  )
}
