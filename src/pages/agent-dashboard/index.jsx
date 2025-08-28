import React, { useState } from 'react';
import GlobalHeader from '../../components/ui/GlobalHeader';
import SidebarLayout from '../../components/ui/SidebarLayout';
import QRMilestoneManager from './components/QRMilestoneManager';
import ValveControlPanel from './components/ValveControlPanel';
import SettlementCalculator from './components/SettlementCalculator';
import AuditAnchorSystem from './components/AuditAnchorSystem';
import Icon from '../../components/AppIcon';
import { useWalletContext } from "../../lib/wallet-context";
import { canAccess } from '../../lib/rbac';

const AgentDashboard = () => {
  const { wallet } = useWalletContext();
  const [currentRole, setCurrentRole] = useState('agent');
  const [activeAlerts, setActiveAlerts] = useState([
    {
      id: 1,
      type: 'settlement',
      message: 'WELL-NE-001 settlement ready for processing',
      priority: 'high',
      timestamp: '2024-08-25T18:30:00Z'
    },
    {
      id: 2,
      type: 'valve',
      message: 'WELL-NE-003 payment overdue - consider flow restriction',
      priority: 'medium',
      timestamp: '2024-08-25T17:45:00Z'
    }
  ]);

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'investor', label: 'Investor Dashboard', icon: 'TrendingUp', path: '/investor-dashboard' },
    { id: 'operator', label: 'Operator Dashboard', icon: 'Settings', path: '/operator-dashboard' },
    { id: 'agent', label: 'Agent Dashboard', icon: 'Shield', path: '/agent-dashboard' },
    { id: 'wells', label: 'Well Explorer', icon: 'Compass', path: '/well-detail-view' },
  ];

  const dismissAlert = (alertId) => {
    setActiveAlerts(prev => prev?.filter(alert => alert?.id !== alertId));
  };

  const getAlertColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-error bg-error/10 text-error';
      case 'medium':
        return 'border-warning bg-warning/10 text-warning';
      case 'low':
        return 'border-primary bg-primary/10 text-primary';
      default:
        return 'border-border bg-muted text-muted-foreground';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'settlement':
        return 'Calculator';
      case 'valve':
        return 'Gauge';
      case 'milestone':
        return 'QrCode';
      case 'audit':
        return 'Archive';
      default:
        return 'Bell';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader 
        isAuthenticated={true} 
        userRole={currentRole} 
        onRoleChange={handleRoleChange}
      />
      <SidebarLayout items={sidebarItems} title="Agent Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Agent Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Settlement agents and auditors - Milestone verification, valve control, and automated revenue distribution
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>Real-time sync active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          {activeAlerts?.length > 0 && (
            <div className="mb-8 space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center">
                <Icon name="AlertTriangle" size={20} className="mr-2 text-warning" />
                Active Alerts ({activeAlerts?.length})
              </h2>
              <div className="grid gap-3">
                {activeAlerts?.map((alert) => (
                  <div 
                    key={alert?.id}
                    className={`p-4 border rounded-lg flex items-center justify-between ${getAlertColor(alert?.priority)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name={getAlertIcon(alert?.type)} size={18} />
                      <div>
                        <div className="font-medium">{alert?.message}</div>
                        <div className="text-xs opacity-75">
                          {new Date(alert.timestamp)?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert?.id)}
                      className="p-1 hover:bg-black/10 rounded transition-smooth"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Panel - QR Milestone Manager */}
            <div className="lg:col-span-1">
              {canAccess(wallet?.accountId, 'agent', 'milestone_verification') ? (
                <QRMilestoneManager />
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">Agent role required for milestone verification</p>
                </div>
              )}
            </div>

            {/* Right Panel - Valve Control Panel */}
            <div className="lg:col-span-1">
              {canAccess(wallet?.accountId, 'agent', 'valve_control') ? (
                <ValveControlPanel />
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">Agent role required for valve control</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settlement Calculator */}
            <div className="lg:col-span-1">
              <SettlementCalculator />
            </div>

            {/* Audit Anchor System */}
            <div className="lg:col-span-1">
              {canAccess(wallet?.accountId, 'agent', 'audit_anchoring') ? (
                <AuditAnchorSystem />
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 text-center">
                  <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
                  <p className="text-muted-foreground">Agent role required for audit anchoring</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success">156</div>
              <div className="text-sm text-muted-foreground">Milestones Verified</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground">Active Wells</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-warning">$24.5K</div>
              <div className="text-sm text-muted-foreground">Pending Settlements</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-secondary">89</div>
              <div className="text-sm text-muted-foreground">Audit Reports</div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </div>
  );
};

export default AgentDashboard;