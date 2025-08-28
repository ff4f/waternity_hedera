import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const WellCard = ({ well, onFundClick, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getFundingPercentage = () => {
    return Math.round((well?.currentFunding / well?.fundingGoal) * 100);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'funding':
        return 'text-warning bg-warning/10';
      case 'active':
        return 'text-success bg-success/10';
      case 'completed':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div 
      className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-modal transition-smooth"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={well?.image}
          alt={well?.name}
          className="w-full h-full object-cover transition-smooth hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <ProofPillComponent 
            transactionHash={well?.transactionHash}
            status="verified"
            size="sm"
            onVerificationClick={() => {}}
          />
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(well?.status)}`}>
            {well?.status}
          </span>
        </div>
      </div>
      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{well?.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="MapPin" size={14} className="mr-1" />
              <span>{well?.location}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails(well)}
            className="opacity-0 group-hover:opacity-100 transition-smooth"
          >
            <Icon name="ExternalLink" size={16} />
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{well?.apy}</div>
            <div className="text-xs text-muted-foreground">Expected APY</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{well?.beneficiaries}</div>
            <div className="text-xs text-muted-foreground">Beneficiaries</div>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="text-foreground font-medium">{getFundingPercentage()}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${getFundingPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">${well?.currentFunding?.toLocaleString()}</span>
            <span className="text-foreground font-medium">${well?.fundingGoal?.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => onFundClick(well)}
            iconName="DollarSign"
            iconPosition="left"
            disabled={well?.status === 'completed'}
          >
            {well?.status === 'completed' ? 'Funded' : 'Fund Now'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewDetails(well)}
            iconName="Eye"
            iconPosition="left"
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WellCard;