import React from 'react'

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
      <img
        src="/codetactic-logo.png"
        alt="CodeTactic"
        style={{ height: 36, width: 'auto', objectFit: 'contain' }}
      />
    </div>
  )
}
