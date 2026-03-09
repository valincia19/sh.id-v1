import { Metadata } from 'next';
import HubsClientPage from './HubsClientPage';

export const metadata: Metadata = {
  title: 'Hubs',
  description: 'Browse official and community script hubs on ScriptHub. Find the perfect collection of scripts for your favorite games.',
  alternates: {
    canonical: 'https://scripthub.id/hubs',
  },
};

export default function HubsPage() {
  return <HubsClientPage />;
}
