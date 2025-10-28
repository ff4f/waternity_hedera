import { Metadata } from 'next';
import IdentityDashboard from '@/components/IdentityDashboard';

export const metadata: Metadata = {
  title: 'THG Identity Dashboard | Waternity',
  description: 'Manage digital credentials and verifiable claims on Hedera Hashgraph',
};

export default function IdentityPage() {
  return <IdentityDashboard />;
}