import { Metadata } from 'next';
import HomeClientPage from './HomeClientPage';

export const metadata: Metadata = {
    title: 'Browse Scripts',
    description: 'Discover working Lua scripts, share your creations, and dominate your favorite games on ScriptHub.',
    alternates: {
        canonical: 'https://scripthub.id/home',
    },
};

export default function HomePage() {
    return <HomeClientPage />;
}
