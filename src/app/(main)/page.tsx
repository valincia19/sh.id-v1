import LandingClientPage from './LandingClientPage';
import type { Metadata } from 'next';

const SITE_URL = 'https://scripthub.id';

export const metadata: Metadata = {
  title: 'ScriptHub – Platform Script Terpercaya',
  description: 'Platform terbaik untuk menemukan dan menggunakan script berkualitas dengan update cepat dan aman. The open platform for Lua script creators.',
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
    title: 'ScriptHub – Platform Script Terpercaya',
    description: 'Platform terbaik untuk menemukan dan menggunakan script berkualitas dengan update cepat dan aman.',
    url: SITE_URL,
    type: 'website',
    images: [{
      url: `${SITE_URL}/og-default.png`,
      width: 1200,
      height: 630,
      alt: 'ScriptHub — The Script Ecosystem',
    }],
    siteName: 'ScriptHub',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScriptHub – Platform Script Terpercaya',
    description: 'Platform terbaik untuk menemukan dan menggunakan script berkualitas dengan update cepat dan aman.',
    images: [{
      url: `${SITE_URL}/og-default.png`,
      alt: 'ScriptHub — The Script Ecosystem',
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
