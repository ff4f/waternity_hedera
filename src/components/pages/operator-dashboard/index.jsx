import React, { useState } from 'react';
import GlobalHeader from '../../components/ui/GlobalHeader';
import SidebarLayout from '../../components/ui/SidebarLayout';
import KPIMetricsGrid from '../../components/ui/KPIMetricsGrid';
import WellManagementTable from './components/WellManagementTable';
import MaintenanceSchedule from './components/MaintenanceSchedule';
import PerformanceChart from './components/PerformanceChart';
import Button from '../../components/ui/Button';
import { mockWells } from '../../data/mock-wells';

const OperatorDashboard = () => {
  const [currentRole, setCurrentRole] = useState('operator');

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
      <SidebarLayout items={sidebarItems} title="Operator Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Operator Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage well operations, monitor performance, and schedule maintenance.
                </p>
              </div>
              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
              >
                Register New Well
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <KPIMetricsGrid wells={mockWells} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <WellManagementTable wells={mockWells} />
            </div>
            <div className="space-y-8">
              <MaintenanceSchedule wells={mockWells} />
              <PerformanceChart wells={mockWells} />
            </div>
          </div>
        </div>
      </SidebarLayout>
    </div>
  );
};

export default OperatorDashboard;