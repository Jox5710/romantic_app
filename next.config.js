/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./lib/i18n/request.ts');

module.exports = withNextIntl({
  output: 'standalone',
  images: {
    // Re-enabled now that we run a real Node server (was forced off for static export).
    // sharp ships with standalone; AVIF/WebP conversion happens transparently.
    formats: ['image/avif', 'image/webp'],
    // Allow images served back through Kong (Supabase storage / imgproxy)
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000' },
      { protocol: 'http', hostname: 'kong', port: '8000' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
});
