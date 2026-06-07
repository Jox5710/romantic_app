import type { MetadataRoute } from 'next';

// Forever is a private, invite-only app for couples — there is nothing here
// that should be indexed. This also resolves the lone /robots.txt 404 that
// browsers/crawlers probe for on first load.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
