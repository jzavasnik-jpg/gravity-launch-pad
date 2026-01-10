import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://launchpad.gravity.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/icp',
          '/icp/*',
          '/sessions',
          '/sessions/*',
          '/settings',
          '/profile',
          '/avatar/*',
          '/product-assets',
          '/content-studio',
          '/media-lab',
          '/pipeline',
          '/complete',
          '/veritas/*',
          '/landing-pad/*',
          '/api/*',
          '/auth/callback',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
