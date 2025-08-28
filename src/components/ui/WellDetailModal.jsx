import React, { useEffect } from 'react';
import Icon from '../AppIcon';
import Image from '../AppImage';
import Button from './Button';
import ProofPillComponent from './ProofPillComponent';

const WellDetailModal = ({ 
  isOpen, 
  onClose, 
  wellData, 
  userRole = 'investor' 
}) => {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !wellData) return null;

  const getRoleSpecificActions = () => {
    switch (userRole) {
      case 'investor':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="default" className="flex-1" iconName="DollarSign" iconPosition="left">
              Invest Now
            </Button>
            <Button variant="outline" className="flex-1" iconName="TrendingUp" iconPosition="left">
              View Returns
            </Button>
          </div>
        );
      case 'operator':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="default" className="flex-1" iconName="Settings" iconPosition="left">
              Manage Project
            </Button>
            <Button variant="outline" className="flex-1" iconName="FileText" iconPosition="left">
              Update Status
            </Button>
          </div>
        );
      case 'agent':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="default" className="flex-1" iconName="Shield" iconPosition="left">
              Verify Milestone
            </Button>
            <Button variant="outline" className="flex-1" iconName="Download" iconPosition="left">
              Generate Report
            </Button>
          </div>
        );
      default:
        return (
          <Button variant="default" fullWidth iconName="Eye" iconPosition="left">
            View Details
          </Button>
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'operational':
        return 'text-success bg-success/10';
      case 'pending': case 'in-progress':
        return 'text-warning bg-warning/10';
      case 'completed':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal">
      <div className="bg-card rounded-lg shadow-modal max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Image
                src={wellData?.image || '/assets/images/well-placeholder.jpg'}
                alt={wellData?.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{wellData?.name}</h2>
              <p className="text-sm text-muted-foreground">{wellData?.location}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Status and Verification */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(wellData?.status)}`}>
                {wellData?.status || 'Active'}
              </span>
              <ProofPillComponent 
                transactionHash={wellData?.transactionHash}
                status="verified"
                size="sm"
                onVerificationClick={() => {}}
              />
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-foreground">
                  {wellData?.fundingGoal || '$50,000'}
                </div>
                <div className="text-sm text-muted-foreground">Funding Goal</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-success">
                  {wellData?.currentFunding || '$32,500'}
                </div>
                <div className="text-sm text-muted-foreground">Current Funding</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">
                  {wellData?.apy || '8.5%'}
                </div>
                <div className="text-sm text-muted-foreground">Expected APY</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-foreground">
                  {wellData?.beneficiaries || '1,250'}
                </div>
                <div className="text-sm text-muted-foreground">Beneficiaries</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="text-foreground font-medium">
                  {wellData?.fundingProgress || '65%'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: wellData?.fundingProgress || '65%' }}
                ></div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Project Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {wellData?.description || 
                  'This water infrastructure project aims to provide clean, sustainable water access to underserved communities while generating stable returns for investors through innovative blockchain-verified impact measurement and revenue distribution systems.'
                }
              </p>
            </div>

            {/* Technical Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Technical Specifications</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Well Depth:</span>
                    <span className="text-foreground">{wellData?.depth || '150 meters'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Water Capacity:</span>
                    <span className="text-foreground">{wellData?.capacity || '5,000 L/day'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Installation Date:</span>
                    <span className="text-foreground">{wellData?.installDate || 'March 2024'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Impact Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Water Quality:</span>
                    <span className="text-success">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance Score:</span>
                    <span className="text-primary">{wellData?.maintenanceScore || '95%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Community Rating:</span>
                    <span className="text-foreground">{wellData?.rating || '4.8/5'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Verification */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-foreground flex items-center">
                <Icon name="Shield" size={16} className="mr-2 text-primary" />
                Blockchain Verification
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <span className="text-muted-foreground">Contract Address:</span>
                  <div className="text-foreground break-all">
                    {wellData?.contractAddress || '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Verification:</span>
                  <div className="text-foreground">
                    {wellData?.lastVerification || '2024-08-25 18:30:15 UTC'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/20">
          {getRoleSpecificActions()}
        </div>
      </div>
    </div>
  );
};

export default WellDetailModal;