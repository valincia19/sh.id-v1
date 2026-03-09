import { Metadata } from 'next';
import { envConfig } from '@/lib/config/env';
import GameClientPage from './GameClientPage';

const SITE_URL = 'https://scripthub.id';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    if (!slug) return {};

    try {
        const baseUrl = envConfig.apiBaseUrl;
        const res = await fetch(`${baseUrl}/games/slug/${slug}`, {
            next: { revalidate: 3600 } // Cache games higher since they change less
        });

        if (!res.ok) return {};

        const data = await res.json();
        const game = data.data;

        if (!game) return {};

        const title = `${game.name} Scripts`;
        const description = game.description
            ? game.description.substring(0, 160)
            : `Find the best working Roblox scripts for ${game.name} on ScriptHub. Get instant access to auto farms, aimbots, ESPs, and more for ${game.name}.`;

        const canonicalUrl = `${SITE_URL}/g/${slug}`;

        // Logo or default
        const logoUrl = game.logo_url || game.logoUrl;
        const finalImageUrl = logoUrl
            ? (logoUrl.startsWith('http') ? logoUrl : `${SITE_URL}${logoUrl}`)
            : `${SITE_URL}/og-default.png`;

        return {
            title,
            description,
            alternates: {
                canonical: canonicalUrl,
            },
            openGraph: {
                title,
                description,
                url: canonicalUrl,
                type: 'website',
                images: [{ url: finalImageUrl }],
            },
            twitter: {
                card: 'summary',
                title,
                description,
                images: [{ url: finalImageUrl }],
            },
        };
    } catch {
        return {
            title: `Game Scripts`,
        };
    }
}

export const dynamic = 'force-dynamic';

export default function GamePage() {
    return <GameClientPage />;
}
