import { Metadata } from 'next';
import SearchClientPage from './SearchClientPage';

export const metadata: Metadata = {
    title: 'Search | ScriptHub',
    description: 'Search for Roblox scripts, hubs, games, and executors on ScriptHub.',
    robots: {
        index: false,
        follow: true,
    },
};

export default function SearchPage() {
    return <SearchClientPage />;
}
