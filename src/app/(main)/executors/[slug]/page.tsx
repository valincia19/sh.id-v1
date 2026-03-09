import { envConfig } from '@/lib/config/env';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import ExecutorClientPage from './ExecutorClientPage';
import { getStorageUrl } from '@/lib/utils/image';

const SITE_URL = 'https://scripthub.id';

async function fetchExecutorData(slug: string) {
    try {
        const baseUrl = envConfig.apiBaseUrl;
        const res = await fetch(`${baseUrl}/executors/slug/${slug}`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data || null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    if (!slug) return {};

    const executor = await fetchExecutorData(slug);
    if (!executor) return {};

    const rawName = executor.name || 'Executor';
    const title = rawName;
    const ownerName = executor.owner_username || executor.ownerUsername;
    const status = executor.status || 'Unknown';
    const platforms = executor.platforms || [];

    // Build a rich, unique description (150–160 chars for Google snippet)
    let description: string;
    if (executor.description && executor.description.trim()) {
        const cleaned = executor.description.replace(/\s+/g, ' ').trim();
        const base = cleaned.length > 100 ? cleaned.substring(0, 97) + '...' : cleaned;
        const extras: string[] = [];
        if (status) extras.push(status);
        if (platforms.length > 0) extras.push(platforms.join(', '));
        const suffix = extras.length > 0 ? ` (${extras.join(' · ')})` : '';
        description = `${base}${suffix} — Get ${rawName} on ScriptHub.`;
    } else {
        const extras: string[] = [];
        if (ownerName) extras.push(`by ${ownerName}`);
        if (status) extras.push(status);
        if (platforms.length > 0) extras.push(`for ${platforms.join(', ')}`);
        description = `Get ${rawName}${extras.length > 0 ? ' — ' + extras.join(' · ') : ''} on ScriptHub, the premier executor directory for Roblox.`;
    }
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }

    // Prefer banner for OG image (landscape), fallback to logo, then default
    const imageUrl = executor.banner_url || executor.bannerUrl || executor.logo_url || executor.logoUrl;
    const finalImageUrl = imageUrl
        ? (getStorageUrl(imageUrl).startsWith('http') ? getStorageUrl(imageUrl) : `${SITE_URL}${getStorageUrl(imageUrl)}`)
        : `${SITE_URL}/og-default.png`;
    const canonicalUrl = `${SITE_URL}/executors/${slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large' as const,
                'max-snippet': -1,
            },
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: 'website',
            images: [{
                url: finalImageUrl,
                alt: `${rawName} — ScriptHub`,
            }],
            siteName: 'ScriptHub',
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [{
                url: finalImageUrl,
                alt: `${rawName} — ScriptHub`,
            }],
        },
    };
}

export const dynamic = 'force-dynamic';

export default async function ExecutorPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const executor = await fetchExecutorData(slug);

    // JSON-LD: SoftwareApplication schema
    const jsonLd = executor ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: executor.name,
        description: executor.description || `A Roblox executor available on ScriptHub.`,
        url: `${SITE_URL}/executors/${slug}`,
        applicationCategory: 'GameApplication',
        operatingSystem: (executor.platforms || []).join(', ') || 'Windows',
        ...(executor.banner_url || executor.bannerUrl || executor.logo_url || executor.logoUrl
            ? { image: getStorageUrl(executor.banner_url || executor.bannerUrl || executor.logo_url || executor.logoUrl) }
            : {}),
        ...(executor.owner_username || executor.ownerUsername
            ? {
                author: {
                    '@type': 'Person',
                    name: executor.owner_username || executor.ownerUsername,
                },
            }
            : {}),
        offers: {
            '@type': 'Offer',
            price: executor.price_model === 'Paid' || executor.priceModel === 'Paid' ? undefined : '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
        },
        publisher: {
            '@type': 'Organization',
            name: 'ScriptHub',
            url: SITE_URL,
        },
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div></div>}>
                <ExecutorClientPage />
            </Suspense>
        </>
    );
}
