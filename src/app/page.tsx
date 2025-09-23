import { Metadata } from 'next'
import DashboardClient from './components/DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard - Waternity',
  description: 'Main dashboard for Waternity water well management platform',
}

export default function HomePage() {
  return <DashboardClient />
}