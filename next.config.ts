import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  images: {
    remotePatterns: [
      // Payload media served by the same host (needed when logo.url is absolute)
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      // Add your production hostname here when deploying, e.g.:
      // { protocol: 'https', hostname: 'yourdomain.com' },
    ],
  },
}

export default withPayload(nextConfig)
