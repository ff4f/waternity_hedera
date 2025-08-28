import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const ActiveProjectsTab = ({ projects, onProjectSelect }) => {
  const [selectedTab, setSelectedTab] = useState('all');

  const mockProjects = [
    {
      id: 'WELL-NE-001',
      name: 'Ngong Hills Community Well',
      location: 'Ngong Hills, Kajiado County',
      image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?w=400',
      status: 'building',
      capex: 50000,
      currentFunding: 32500,
      fundingProgress: 65,
      milestonesCompleted: 3,
      totalMilestones: 8,
      expectedAPY: 8.5,
      beneficiaries: 1250,
      createdDate: '2024-08-15',
      lastUpdate: '2024-08-25',
      transactionHash: '0x1234567890abcdef1234567890abcdef12345678'
    },
    {
      id: 'WELL-CE-002',
      name: 'Machakos Water Point',
      location: 'Machakos Town, Machakos County',
      image: 'https://images.pixabay.com/photo/2016/11/29/05/45/well-1867140_1280.jpg?w=400',
      status: 'funding',
      capex: 75000,
      currentFunding: 18750,
      fundingProgress: 25,
      milestonesCompleted: 1,
      totalMilestones: 8,
      expectedAPY: 9.2,
      beneficiaries: 2100,
      createdDate: '2024-08-20',
      lastUpdate: '2024-08-25',
      transactionHash: '0x2345678901bcdef12345678901bcdef123456789'
    },
    {
      id: 'WELL-WE-003',
      name: 'Kisumu Rural Access',
      location: 'Kisumu County',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
      status: 'live',
      capex: 60000,
      currentFunding: 60000,
      fundingProgress: 100,
      milestonesCompleted: 8,
      totalMilestones: 8,
      expectedAPY: 7.8,
      beneficiaries: 1800,
      createdDate: '2024-07-10',
      lastUpdate: '2024-08-25',
      transactionHash: '0x3456789012cdef123456789012cdef1234567890',
      dailyRevenue: 4.2,
      monthlyRevenue: 126
    }
  ];

  const tabs = [
    { id: 'all', label: 'All Projects', count: mockProjects?.length },
    { id: 'funding', label: 'Funding', count: mockProjects?.filter(p => p?.status === 'funding')?.length },
    { id: 'building', label: 'Building', count: mockProjects?.filter(p => p?.status === 'building')?.length },
    { id: 'live', label: 'Live', count: mockProjects?.filter(p => p?.status === 'live')?.length }
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'funding':
        return {
          color: 'text-warning bg-warning/10',
          icon: 'DollarSign',
          label: 'Funding Open'
        };
      case 'building':
        return {
          color: 'text-primary bg-primary/10',
          icon: 'Hammer',
          label: 'Under Construction'
        };
      case 'live':
        return {
          color: 'text-success bg-success/10',
          icon: 'CheckCircle',
          label: 'Operational'
        };
      default:
        return {
          color: 'text-muted-foreground bg-muted',
          icon: 'Circle',
          label: 'Unknown'
        };
    }
  };

  const filteredProjects = selectedTab === 'all' 
    ? mockProjects 
    : mockProjects?.filter(project => project?.status === selectedTab);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setSelectedTab(tab?.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-smooth
                ${selectedTab === tab?.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              {tab?.label}
              <span className="ml-2 bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                {tab?.count}
              </span>
            </button>
          ))}
        </nav>
      </div>
      {/* Projects Grid */}
      {filteredProjects?.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="Folder" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground">
            {selectedTab === 'all' ?'Start by creating your first water infrastructure project.'
              : `No projects in ${selectedTab} status.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => {
            const statusConfig = getStatusConfig(project?.status);
            
            return (
              <div key={project?.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-card transition-smooth">
                {/* Project Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={project?.image}
                    alt={project?.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color}`}>
                      <Icon name={statusConfig?.icon} size={12} className="inline mr-1" />
                      {statusConfig?.label}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <ProofPillComponent
                      transactionHash={project?.transactionHash}
                      status="verified"
                      size="sm"
                      onVerificationClick={() => {}}
                    />
                  </div>
                </div>
                {/* Project Details */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{project?.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Icon name="MapPin" size={12} className="mr-1" />
                      {project?.location}
                    </p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        ${project?.capex?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">CAPEX</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-success">
                        {project?.expectedAPY}%
                      </div>
                      <div className="text-xs text-muted-foreground">Expected APY</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">
                        {project?.beneficiaries?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Beneficiaries</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {project?.milestonesCompleted}/{project?.totalMilestones}
                      </div>
                      <div className="text-xs text-muted-foreground">Milestones</div>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-3 mb-4">
                    {/* Funding Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Funding</span>
                        <span className="text-foreground">{project?.fundingProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project?.fundingProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Milestone Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Construction</span>
                        <span className="text-foreground">
                          {Math.round((project?.milestonesCompleted / project?.totalMilestones) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(project?.milestonesCompleted / project?.totalMilestones) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Info (for live projects) */}
                  {project?.status === 'live' && project?.dailyRevenue && (
                    <div className="bg-success/10 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Daily Revenue:</span>
                        <span className="text-success font-medium">${project?.dailyRevenue}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Revenue:</span>
                        <span className="text-success font-medium">${project?.monthlyRevenue}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      fullWidth
                      onClick={() => onProjectSelect && onProjectSelect(project)}
                      iconName="Eye"
                      iconPosition="left"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Settings"
                      iconPosition="left"
                    >
                      Manage
                    </Button>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>ID: {project?.id}</span>
                      <span>Updated: {project?.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveProjectsTab;