import React from 'react';
import RealTimeMonitoringDashboard from '@/components/monitoring/RealTimeMonitoringDashboard';

const MonitoringPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <RealTimeMonitoringDashboard />
      </div>
    </div>
  );
};

export default MonitoringPage;

export const metadata = {
  title: 'Real-Time Monitoring | Waternity',
  description: 'Real-time monitoring dashboard for water wells, quality tests, and transactions on Hedera network',
};