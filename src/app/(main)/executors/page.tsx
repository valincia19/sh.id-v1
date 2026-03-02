import { Metadata } from 'next';
import ExecutorsClientPage from './ExecutorsClientPage';

export const metadata: Metadata = {
  title: 'Executors | ScriptHub',
  description: 'Browse supported executors, their status, and compatibility on ScriptHub.',
  alternates: {
    canonical: 'https://scripthub.id/executors',
  },
};

export default function ExecutorsPage() {
  return <ExecutorsClientPage />;
}
