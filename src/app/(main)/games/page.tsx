import { Metadata } from 'next';
import GamesClientPage from './GamesClientPage';

export const metadata: Metadata = {
    title: 'Games | ScriptHub',
    description: 'Browse Roblox games with active script communities on ScriptHub.',
    alternates: {
        canonical: 'https://scripthub.id/games',
    },
};

export default function GamesPage() {
    return <GamesClientPage />;
}
