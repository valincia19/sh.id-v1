import { envConfig } from '@/lib/config/env';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import HubClientPage from './HubClientPage';
import { getStorageUrl } from '@/lib/utils/image';

const SITE_URL = 'https://scripthub.id';

async function fetchHubData(slug: string) {
  try {
    const baseUrl = envConfig.apiBaseUrl;
    const res = await fetch(`${baseUrl}/hubs/slug/${slug}`, {
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

  const hub = await fetchHubData(slug);
  if (!hub) return {};

  const rawName = hub.name || 'Hub';
  const title = `${rawName} | ScriptHub`;
  const scriptCount = hub.script_count || hub.scriptCount || 0;
  const isVerified = hub.is_verified || hub.isVerified;

  // Build a rich, unique description (150–160 chars for Google snippet)
  let description: string;
  if (hub.description && hub.description.trim()) {
    const cleaned = hub.description.replace(/\s+/g, ' ').trim();
    const base = cleaned.length > 100 ? cleaned.substring(0, 97) + '...' : cleaned;
    const extras: string[] = [];
    if (scriptCount > 0) extras.push(`${scriptCount} scripts`);
    if (isVerified) extras.push('verified');
    const suffix = extras.length > 0 ? ` (${extras.join(', ')})` : '';
    description = `${base}${suffix} — Explore ${rawName} on ScriptHub.`;
  } else {
    const extras: string[] = [];
    if (scriptCount > 0) extras.push(`${scriptCount} scripts`);
    if (isVerified) extras.push('verified hub');
    const suffix = extras.length > 0 ? ` with ${extras.join(' and ')}` : '';
    description = `Explore ${rawName}${suffix} on ScriptHub — the premier script ecosystem for Roblox builders.`;
  }
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  // Prefer banner for OG image (landscape), fallback to logo, then default
  const imageUrl = hub.banner_url || hub.bannerUrl || hub.logo_url || hub.logoUrl;
  const finalImageUrl = imageUrl
    ? (getStorageUrl(imageUrl).startsWith('http') ? getStorageUrl(imageUrl) : `${SITE_URL}${getStorageUrl(imageUrl)}`)
    : `${SITE_URL}/og-default.png`;
  const canonicalUrl = `${SITE_URL}/h/${slug}`;

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

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hub = await fetchHubData(slug);

  // JSON-LD: CollectionPage schema
  const jsonLd = hub ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.name,
    description: hub.description || `A script hub on ScriptHub.`,
    url: `${SITE_URL}/h/${slug}`,
    ...(hub.banner_url || hub.bannerUrl || hub.logo_url || hub.logoUrl
      ? { image: getStorageUrl(hub.banner_url || hub.bannerUrl || hub.logo_url || hub.logoUrl) }
      : {}),
    ...(hub.script_count || hub.scriptCount
      ? { numberOfItems: hub.script_count || hub.scriptCount }
      : {}),
    isPartOf: {
      '@type': 'WebSite',
      name: 'ScriptHub',
      url: SITE_URL,
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
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><span className="loading loading-spinner loading-lg text-emerald-500"></span></div>}>
        <HubClientPage />
      </Suspense>
    </>
  );
}
