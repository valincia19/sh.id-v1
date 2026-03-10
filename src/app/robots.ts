import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/studio/',
                    '/admin/',
                    '/getfreekey/',
                    '/getkey/',
                    '/search',
                ],
            },
        ],
        sitemap: 'https://scripthub.id/sitemap.xml',
    };
}
