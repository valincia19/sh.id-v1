import type { MetadataRoute } from 'next';
import { envConfig } from '@/lib/config/env';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://scripthub.id';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = envConfig.apiBaseUrl;

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/trending`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/hubs`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/games`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/executors`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];

    // Helper to safely parse dates for sitemap
    const safeDate = (dateStr: string | undefined): Date => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    // Dynamic script pages
    let scriptEntries: MetadataRoute.Sitemap = [];
    try {
        const scriptsRes = await fetch(`${baseUrl}/scripts?limit=5000&page=1`);
        if (scriptsRes.ok) {
            const scriptsData = await scriptsRes.json();
            const scripts = scriptsData?.data?.scripts || scriptsData?.data || [];
            if (Array.isArray(scripts)) {
                scriptEntries = scripts
                    .filter((s: any) => s && s.slug && s.is_published !== false)
                    .map((script: any) => ({
                        url: `${SITE_URL}/s/${script.slug}`,
                        lastModified: safeDate(script.updated_at || script.updatedAt || script.created_at || script.createdAt),
                        changeFrequency: 'weekly' as const,
                        priority: 0.8,
                    }));
            }
        }
    } catch (e) {
        console.error('[Sitemap] Failed to fetch scripts at build time:', e);
    }

    // Dynamic hub pages
    let hubEntries: MetadataRoute.Sitemap = [];
    try {
        const hubsRes = await fetch(`${baseUrl}/hubs?limit=5000&page=1`);
        if (hubsRes.ok) {
            const hubsData = await hubsRes.json();
            const hubs = hubsData?.data?.hubs || hubsData?.data || [];
            if (Array.isArray(hubs)) {
                hubEntries = hubs
                    .filter((h: any) => h && h.slug && h.status !== 'suspended')
                    .map((hub: any) => ({
                        url: `${SITE_URL}/h/${hub.slug}`,
                        lastModified: safeDate(hub.updated_at || hub.updatedAt || hub.created_at || hub.createdAt),
                        changeFrequency: 'weekly' as const,
                        priority: 0.7,
                    }));
            }
        }
    } catch (e) {
        console.error('[Sitemap] Failed to fetch hubs at build time:', e);
    }

    return [...staticPages, ...scriptEntries, ...hubEntries];
}
