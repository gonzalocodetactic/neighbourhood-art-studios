import React from 'react'
import type { Payload } from 'payload'
import { NasLogo } from '@/components/NasLogo'
import { getMediaUrl } from '@/utilities/getMediaUrl'

const SIZE = 28

// Breadcrumb / dashboard icon: the Neighbourhood Art Studios logo uploaded in
// Header Settings (the same one the public site uses), falling back to the SVG mark.
export async function Icon({ payload }: { payload?: Payload }) {
  let logo: { url?: string; alt?: string } | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (await payload?.findGlobal({ slug: 'header-settings', depth: 1 })) as any
    if (settings?.logo && typeof settings.logo === 'object') logo = settings.logo
  } catch {
    /* fall back to the SVG mark */
  }

  return (
    <span className="nas-admin-icon" style={{ display: 'flex', alignItems: 'center', width: SIZE, height: SIZE }}>
      {logo?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getMediaUrl(logo)}
          alt={logo.alt || 'Neighbourhood Art Studios'}
          width={SIZE}
          height={SIZE}
          style={{ width: SIZE, height: SIZE, objectFit: 'contain', borderRadius: '50%' }}
        />
      ) : (
        <NasLogo size={SIZE} />
      )}
    </span>
  )
}
