import React, { useState } from 'react';
import GlobalHeader from '../../components/ui/GlobalHeader';
import SidebarLayout from '../../components/ui/SidebarLayout';
import WellDetailModal from '../../components/ui/WellDetailModal';
import ProjectWizard from './components/ProjectWizard';
import MilestoneTracker from './components/MilestoneTracker';
import ActiveProjectsTab from './components/ActiveProjectsTab';
import OperatorKPICards from './components/OperatorKPICards';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const OperatorDashboard = () => {
  const [currentRole, setCurrentRole] = useState('operator');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isWellModalOpen, setIsWellModalOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Mock wallet for RBAC demo - would be replaced with real wallet context
  const wallet = { accountId: '0.0.234567', connected: true };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'BarChart3',
      description: 'Dashboard metrics and summary'
    },
    {
      id: 'projects',
      label: 'Active Projects',
      icon: 'Building',
      description: 'Manage ongoing projects'
    },
    {
      id: 'wizard',
      label: 'New Project',
      icon: 'Plus',
      description: 'Create new water infrastructure project'
    },
    {
      id: 'milestones',
      label: 'Milestones',
      icon: 'CheckSquare',
      description: 'Track construction progress'
    }
  ];

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

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setIsWellModalOpen(true);
  };

  const handleWizardComplete = (nftData) => {
    console.log('NFT Minted:', nftData);
    setShowWizard(false);
    setActiveTab('projects');
  };

  const handleMilestoneUpdate = (milestoneId) => {
    console.log('Milestone updated:', milestoneId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Welcome back, Water Operator
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Manage your water infrastructure projects and track construction progress through our blockchain-verified system.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-muted-foreground">Hedera Network Connected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Real-time Monitoring Active</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Button
                    onClick={() => setActiveTab('wizard')}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Start New Project
                  </Button>
                </div>
              </div>
            </div>
            {/* KPI Cards */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Performance Overview</h3>
              <OperatorKPICards />
            </div>
            {/* Quick Actions */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setActiveTab('wizard')}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Create New Project
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setActiveTab('milestones')}
                  iconName="CheckSquare"
                  iconPosition="left"
                >
                  Update Milestones
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setActiveTab('projects')}
                  iconName="Eye"
                  iconPosition="left"
                >
                  View All Projects
                </Button>
              </div>
            </div>
            {/* Recent Activity */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    action: 'Milestone completed',
                    project: 'Ngong Hills Community Well',
                    time: '2 hours ago',
                    icon: 'CheckCircle',
                    color: 'text-success'
                  },
                  {
                    id: 2,
                    action: 'Funding milestone reached',
                    project: 'Machakos Water Point',
                    time: '5 hours ago',
                    icon: 'DollarSign',
                    color: 'text-warning'
                  },
                  {
                    id: 3,
                    action: 'New project created',
                    project: 'Kisumu Rural Access',
                    time: '1 day ago',
                    icon: 'Plus',
                    color: 'text-primary'
                  }
                ]?.map((activity) => (
                  <div key={activity?.id} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-muted ${activity?.color}`}>
                      <Icon name={activity?.icon} size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity?.action}</p>
                      <p className="text-xs text-muted-foreground">{activity?.project}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity?.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Active Projects</h2>
                <p className="text-muted-foreground">Manage your water infrastructure projects</p>
              </div>
              <Button
                onClick={() => setActiveTab('wizard')}
                iconName="Plus"
                iconPosition="left"
              >
                New Project
              </Button>
            </div>
            <ActiveProjectsTab projects={[]} onProjectSelect={handleProjectSelect} />
          </div>
        );

      case 'wizard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create New Project</h2>
                <p className="text-muted-foreground">
                  Follow the 3-step wizard to set up your water infrastructure project
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveTab('overview')}
                iconName="ArrowLeft"
                iconPosition="left"
              >
                Back to Overview
              </Button>
            </div>
            <ProjectWizard currentProject={null} onStepComplete={handleWizardComplete} />
          </div>
        );

      case 'milestones':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Project Milestones</h2>
                <p className="text-muted-foreground">
                  Track construction progress and manage fund releases
                </p>
              </div>
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
              >
                Export Progress Report
              </Button>
            </div>
            <MilestoneTracker
              projectId="WELL-NE-001"
              onMilestoneUpdate={handleMilestoneUpdate}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <GlobalHeader
        isAuthenticated={true}
        userRole={currentRole}
        onRoleChange={handleRoleChange}
        wallet={wallet}
      />
      {/* Sidebar Layout */}
      <SidebarLayout items={sidebarItems} title="Operator Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-border">
              <nav className="flex space-x-8 overflow-x-auto">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-smooth whitespace-nowrap
                      ${activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }
                    `}
                  >
                    <Icon name={tab?.icon} size={16} className="mr-2" />
                    <div className="text-left">
                      <div>{tab?.label}</div>
                      <div className="text-xs opacity-75 hidden sm:block">{tab?.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </SidebarLayout>
      {/* Well Detail Modal */}
      <WellDetailModal
        isOpen={isWellModalOpen}
        onClose={() => setIsWellModalOpen(false)}
        wellData={selectedProject}
        userRole={currentRole}
      />
    </div>
  );
};

export default OperatorDashboard;