import { envConfig } from '@/lib/config/env';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import ScriptClientPage from './ScriptClientPage';
import { getStorageUrl } from '@/lib/utils/image';

const SITE_URL = 'https://scripthub.id';

async function fetchScriptData(slug: string) {
    try {
        const baseUrl = envConfig.apiBaseUrl;
        const res = await fetch(`${baseUrl}/scripts/slug/${slug}`, {
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

    const script = await fetchScriptData(slug);
    if (!script) return {};

    const rawTitle = script.title || 'Script';
    const title = rawTitle;
    const ownerName = script.ownerUsername || script.owner_username || 'a developer';
    const gameName = script.gameName || script.game_name;

    // Build a rich, unique description (150–160 chars for Google snippet)
    let description: string;
    if (script.description && script.description.trim()) {
        const cleaned = script.description.replace(/\s+/g, ' ').trim();
        const base = cleaned.length > 120 ? cleaned.substring(0, 117) + '...' : cleaned;
        description = `${base} Get ${rawTitle} on ScriptHub — safe, fast, and trusted.`;
    } else {
        description = `Get ${rawTitle} by ${ownerName} on ScriptHub${gameName ? ` for ${gameName}` : ''}. The premier script ecosystem for Roblox builders.`;
    }
    // Hard cap at 160
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }

    const thumbnailUrl = script.thumbnailUrl || script.thumbnail_url;
    const imageUrl = thumbnailUrl ? getStorageUrl(thumbnailUrl) : `${SITE_URL}/og-default.png`;
    const finalImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
    const canonicalUrl = `${SITE_URL}/s/${slug}`;

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
                width: 1200,
                height: 630,
                alt: `${rawTitle} - ScriptHub`,
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
                alt: `${rawTitle} - ScriptHub`,
            }],
        },
    };
}

export const dynamic = 'force-dynamic';

export default async function ScriptPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const script = await fetchScriptData(slug);

    // JSON-LD: SoftwareApplication schema
    const jsonLd = script ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: script.title,
        description: script.description || `A Roblox script available on ScriptHub.`,
        url: `${SITE_URL}/s/${slug}`,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Roblox',
        ...(script.thumbnailUrl || script.thumbnail_url
            ? { image: getStorageUrl(script.thumbnailUrl || script.thumbnail_url) }
            : {}),
        author: {
            '@type': 'Person',
            name: script.ownerUsername || script.owner_username || 'ScriptHub Developer',
        },
        offers: {
            '@type': 'Offer',
            price: script.isPaid ? undefined : '0',
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
        <main className="w-full flex flex-col flex-1">
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="loading loading-spinner loading-lg text-emerald-500"></span></div>}>
                <ScriptClientPage />
            </Suspense>
        </main>
    );
}
