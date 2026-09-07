import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://corda.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/profile/', '/tasks/', '/teams/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
