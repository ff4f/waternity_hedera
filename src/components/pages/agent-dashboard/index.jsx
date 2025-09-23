import React, { useState } from 'react';
import GlobalHeader from '../../components/ui/GlobalHeader';
import SidebarLayout from '../../components/ui/SidebarLayout';
import VerificationQueue from './components/VerificationQueue';
import DisputeResolution from './components/DisputeResolution';
import AgentPerformance from './components/AgentPerformance';
import OnchainID from './components/OnchainID';
import { mockVerifications, mockDisputes } from '../../data/mock-agent-data';

const AgentDashboard = () => {
  const [currentRole, setCurrentRole] = useState('agent');

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
  };

  const sidebarItems = [
    { id: 'investor', label: 'Investor Dashboard', icon: 'TrendingUp', path: '/investor-dashboard' },
    { id: 'operator', label: 'Operator Dashboard', icon: 'Settings', path: '/operator-dashboard' },
    { id: 'agent', label: 'Agent Dashboard', icon: 'Shield', path: '/agent-dashboard' },
    { id: 'wells', label: 'Well Explorer', icon: 'Compass', path: '/well-detail-view' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader 
        isAuthenticated={true}
        userRole={currentRole}
        onRoleChange={handleRoleChange}
      />
      <SidebarLayout items={sidebarItems} title="Agent Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Agent Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Verify project milestones and manage your on-chain identity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <VerificationQueue verifications={mockVerifications} />
              <DisputeResolution disputes={mockDisputes} />
            </div>
            <div className="space-y-8">
              <OnchainID />
              <AgentPerformance />
            </div>
          </div>
        </div>
      </SidebarLayout>
    </div>
  );
};

export default AgentDashboard;