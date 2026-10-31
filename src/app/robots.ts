import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/search', '/privacy', '/terms'],
        disallow: ['/dashboard/', '/rfq/', '/admin/', '/api/'],
      },
    ],
    sitemap: 'https://tradex.local/sitemap.xml',
  };
}
