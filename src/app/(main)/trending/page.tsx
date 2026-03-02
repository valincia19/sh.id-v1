import { Metadata } from 'next';
import TrendingClientPage from './TrendingClientPage';

export const metadata: Metadata = {
    title: 'Trending Scripts | ScriptHub',
    description: 'Discover the most popular and highly-rated Roblox scripts on ScriptHub today.',
    alternates: {
        canonical: 'https://scripthub.id/trending',
    },
};

export default function TrendingPage() {
    return <TrendingClientPage />;
}
