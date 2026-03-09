import LandingClientPage from './LandingClientPage';
import type { Metadata } from 'next';

const SITE_URL = 'https://scripthub.id';

export const metadata: Metadata = {
  title: 'ScriptHub - The Script Ecosystem for Roblox Developers',
  description: 'The premier platform for Lua script creators. Securely distribute, monetize, and manage your scripts with our purpose-built infrastructure.',
  alternates: {
    canonical: SITE_URL,
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
    title: 'ScriptHub - The Script Ecosystem',
    description: 'Publish, protect, and monetize your Roblox scripts with ScriptHub. High-speed CDN, HWID locking, and advanced analytics.',
    url: SITE_URL,
    type: 'website',
    images: [{
      url: `${SITE_URL}/og-default.png`,
      width: 1200,
      height: 630,
      alt: 'ScriptHub - The Script Ecosystem',
    }],
    siteName: 'ScriptHub',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScriptHub - The Script Ecosystem',
    description: 'The professional choice for Roblox script distribution and monetization.',
    images: [{
      url: `${SITE_URL}/og-default.png`,
      alt: 'ScriptHub - The Script Ecosystem',
    }],
  },
};

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ScriptHub',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClientPage />
    </>
  );
}
