import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const MilestoneTracker = ({ projectId, onMilestoneUpdate }) => {
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      name: 'Permit',
      description: 'Construction permits approved',
      status: 'completed',
      fundRelease: 10,
      completedDate: '2024-08-15',
      transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
      icon: 'FileCheck'
    },
    {
      id: 2,
      name: 'Drilling',
      description: 'Well drilling completed',
      status: 'completed',
      fundRelease: 25,
      completedDate: '2024-08-20',
      transactionHash: '0x2345678901bcdef12345678901bcdef123456789',
      icon: 'Drill'
    },
    {
      id: 3,
      name: 'Casing',
      description: 'Well casing installation',
      status: 'in-progress',
      fundRelease: 15,
      completedDate: null,
      transactionHash: null,
      icon: 'Cylinder'
    },
    {
      id: 4,
      name: 'Pump',
      description: 'Water pump installation',
      status: 'pending',
      fundRelease: 20,
      completedDate: null,
      transactionHash: null,
      icon: 'Zap'
    },
    {
      id: 5,
      name: 'Meter/Valve',
      description: 'Smart meter and valve setup',
      status: 'pending',
      fundRelease: 10,
      completedDate: null,
      transactionHash: null,
      icon: 'Gauge'
    },
    {
      id: 6,
      name: 'Tariff',
      description: 'Pricing configuration',
      status: 'pending',
      fundRelease: 5,
      completedDate: null,
      transactionHash: null,
      icon: 'DollarSign'
    },
    {
      id: 7,
      name: 'Go-Live',
      description: 'System operational',
      status: 'pending',
      fundRelease: 10,
      completedDate: null,
      transactionHash: null,
      icon: 'Play'
    },
    {
      id: 8,
      name: 'First 10k Liters',
      description: 'Initial water delivery milestone',
      status: 'pending',
      fundRelease: 5,
      completedDate: null,
      transactionHash: null,
      icon: 'Droplets'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10 border-success/20';
      case 'in-progress':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'pending':
        return 'text-muted-foreground bg-muted border-border';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'in-progress':
        return 'Clock';
      case 'pending':
        return 'Circle';
      default:
        return 'Circle';
    }
  };

  const completedMilestones = milestones?.filter(m => m?.status === 'completed')?.length;
  const totalFundReleased = milestones?.filter(m => m?.status === 'completed')?.reduce((sum, m) => sum + m?.fundRelease, 0);

  const handleMarkComplete = (milestoneId) => {
    setMilestones(prev => prev?.map(milestone => 
      milestone?.id === milestoneId 
        ? {
            ...milestone,
            status: 'completed',
            completedDate: new Date()?.toISOString()?.split('T')?.[0],
            transactionHash: `0x${Math.random()?.toString(16)?.substring(2, 42)}`
          }
        : milestone
    ));

    if (onMilestoneUpdate) {
      onMilestoneUpdate(milestoneId);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Project Milestones</h3>
            <p className="text-sm text-muted-foreground">Track construction progress and fund releases</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{completedMilestones}/8</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-lg font-semibold text-success">{totalFundReleased}%</div>
            <div className="text-sm text-muted-foreground">Funds Released</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-lg font-semibold text-primary">
              ${(50000 * totalFundReleased / 100)?.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Amount Released</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-foreground">{Math.round((completedMilestones / 8) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedMilestones / 8) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      {/* Milestones List */}
      <div className="p-6">
        <div className="space-y-4">
          {milestones?.map((milestone, index) => (
            <div key={milestone?.id} className="relative">
              {/* Connector Line */}
              {index < milestones?.length - 1 && (
                <div className="absolute left-5 top-12 w-0.5 h-16 bg-border"></div>
              )}

              <div className="flex items-start space-x-4">
                {/* Status Icon */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-smooth
                  ${getStatusColor(milestone?.status)}
                `}>
                  <Icon name={getStatusIcon(milestone?.status)} size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center">
                        <Icon name={milestone?.icon} size={14} className="mr-2" />
                        {milestone?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{milestone?.description}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Fund Release Badge */}
                      <div className="bg-muted/50 px-2 py-1 rounded text-xs font-medium text-foreground">
                        {milestone?.fundRelease}%
                      </div>

                      {/* Action Button */}
                      {milestone?.status === 'in-progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkComplete(milestone?.id)}
                          iconName="Check"
                          iconPosition="left"
                        >
                          Mark Complete
                        </Button>
                      )}

                      {milestone?.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          iconName="Clock"
                          iconPosition="left"
                        >
                          Waiting
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Completion Details */}
                  {milestone?.status === 'completed' && (
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="text-xs text-muted-foreground">
                        Completed: {milestone?.completedDate}
                      </div>
                      <ProofPillComponent
                        transactionHash={milestone?.transactionHash}
                        status="verified"
                        size="sm"
                        onVerificationClick={() => {}}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Summary Footer */}
      <div className="p-6 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Next milestone: <span className="font-medium text-foreground">
              {milestones?.find(m => m?.status === 'in-progress')?.name || 
               milestones?.find(m => m?.status === 'pending')?.name || 'All Complete'}
            </span>
          </div>
          <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneTracker;