import { Metadata } from 'next';
import TokenDashboard from '@/components/TokenDashboard';

export const metadata: Metadata = {
  title: 'Token Dashboard - Waternity',
  description: 'Manage HTS tokens for the Waternity ecosystem',
};

export default function TokensPage() {
  return <TokenDashboard />;
}