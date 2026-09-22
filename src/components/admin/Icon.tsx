import React from 'react'

export function Icon() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#E0251A" />
        <path
          d="M22 10.5C20.3 8.9 18.3 8 16 8C11.6 8 8 11.6 8 16C8 20.4 11.6 24 16 24C18.3 24 20.3 23.1 22 21.5L19.5 19C18.5 19.9 17.3 20.5 16 20.5C13.5 20.5 11.5 18.5 11.5 16C11.5 13.5 13.5 11.5 16 11.5C17.3 11.5 18.5 12.1 19.5 13L22 10.5Z"
          fill="white"
        />
        <path d="M20 16L24 12V20L20 16Z" fill="white" />
      </svg>
    </div>
  )
}
