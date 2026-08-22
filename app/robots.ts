import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    },
    sitemap: 'https://aisim1.teachmeai.in/sitemap.xml',
    host: 'https://aisim1.teachmeai.in',
  };
}
