import { Metadata } from 'next';
import { envConfig } from '@/lib/config/env';
import UserProfileClientPage from './UserProfileClientPage';

const SITE_URL = 'https://scripthub.id';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;
    if (!username) return {};

    try {
        const baseUrl = envConfig.apiBaseUrl;
        const res = await fetch(`${baseUrl}/users/${username}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) return {};

        const data = await res.json();
        const profile = data.data;

        if (!profile) return {};

        const title = `@${profile.username}`;
        const description = profile.bio
            ? profile.bio.substring(0, 160)
            : `Check out scripts by ${profile.display_name || profile.username} on ScriptHub.`;

        const canonicalUrl = `${SITE_URL}/p/${username}`;

        // Avatar or default
        const avatarUrl = profile.avatar_url || profile.avatarUrl;
        const finalImageUrl = avatarUrl
            ? (avatarUrl.startsWith('http') ? avatarUrl : `${SITE_URL}${avatarUrl}`)
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
                type: 'profile',
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
            title: `@${username}`,
        };
    }
}

export const dynamic = 'force-dynamic';

export default function UserProfilePage() {
    return <UserProfileClientPage />;
}
