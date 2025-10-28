import { Metadata } from 'next';
import RewardsDashboard from '@/components/RewardsDashboard';

export const metadata: Metadata = {
  title: 'Conservation Rewards - Waternity',
  description: 'Gamified conservation rewards system for water conservation activities',
};

export default function RewardsPage() {
  return <RewardsDashboard />;
}