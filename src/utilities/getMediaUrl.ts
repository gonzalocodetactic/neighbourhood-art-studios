type MediaInput = { url?: string; alt?: string } | number | string | null | undefined

export function getMediaUrl(media: MediaInput): string | null {
  if (!media || typeof media !== 'object') return null
  const url = (media as { url?: string }).url
  if (!url) return null
  // Prepend server origin for Payload relative paths so they resolve correctly
  // in SSR/API contexts or when served from a different port.
  if (url.startsWith('/')) {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
    return serverUrl ? `${serverUrl}${url}` : url
  }
  return url
}

export function getMediaAlt(media: MediaInput): string {
  if (!media || typeof media !== 'object') return ''
  return (media as { alt?: string }).alt ?? ''
}
