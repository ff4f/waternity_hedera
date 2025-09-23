import React from 'react';
import Icon from '../../../components/AppIcon';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const WellOverviewTab = ({ wellData }) => {
  const impactMetrics = [
    {
      icon: 'Users',
      label: 'Families Served',
      value: wellData?.familiesServed || '1,250',
      color: 'text-primary'
    },
    {
      icon: 'Droplets',
      label: 'Daily Capacity',
      value: wellData?.dailyCapacity || '5,000L',
      color: 'text-secondary'
    },
    {
      icon: 'MapPin',
      label: 'Coverage Area',
      value: wellData?.coverageArea || '15 km²',
      color: 'text-success'
    },
    {
      icon: 'Clock',
      label: 'Operational Hours',
      value: wellData?.operationalHours || '24/7',
      color: 'text-warning'
    }
  ];

  const fundingProgress = parseInt(wellData?.fundingProgress?.replace('%', '') || '65');

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Project Summary</h3>
        <p className="text-muted-foreground leading-relaxed mb-4">
          {wellData?.description || 
            `This water infrastructure project aims to provide clean, sustainable water access to underserved communities in ${wellData?.location || 'rural areas'}. The project utilizes advanced filtration technology and solar-powered pumping systems to ensure reliable water delivery while generating stable returns for investors through our innovative blockchain-verified impact measurement system.`
          }
        </p>
        <div className="flex flex-wrap gap-2">
          <ProofPillComponent 
            transactionHash={wellData?.transactionHash || '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b'}
            status="verified"
            size="sm"
            showDetails={true}
            onVerificationClick={() => {}}
          />
          <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
            {wellData?.status || 'Operational'}
          </span>
        </div>
      </div>
      {/* Location Mapping */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Location & Coverage</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Icon name="MapPin" size={16} className="mr-2 text-primary" />
              <span className="text-muted-foreground">Primary Location:</span>
              <span className="text-foreground ml-2">{wellData?.location || 'Ngong Hills, Kenya'}</span>
            </div>
            <div className="flex items-center text-sm">
              <Icon name="Navigation" size={16} className="mr-2 text-primary" />
              <span className="text-muted-foreground">Coordinates:</span>
              <span className="text-foreground ml-2 font-mono">{wellData?.coordinates || '-1.3833, 36.6500'}</span>
            </div>
            <div className="flex items-center text-sm">
              <Icon name="Ruler" size={16} className="mr-2 text-primary" />
              <span className="text-muted-foreground">Elevation:</span>
              <span className="text-foreground ml-2">{wellData?.elevation || '1,800m above sea level'}</span>
            </div>
          </div>
          <div className="h-48 rounded-lg overflow-hidden border border-border">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              title={wellData?.name || 'Well Location'}
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${wellData?.coordinates || '-1.3833,36.6500'}&z=14&output=embed`}
              className="border-0"
            />
          </div>
        </div>
      </div>
      {/* Funding Progress */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Funding Progress</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {wellData?.currentFunding || '$32,500'}
              </p>
              <p className="text-sm text-muted-foreground">
                of {wellData?.fundingGoal || '$50,000'} goal
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">
                {fundingProgress}%
              </p>
              <p className="text-sm text-muted-foreground">
                {wellData?.investorCount || '47'} investors
              </p>
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
              style={{ width: `${fundingProgress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Started: {wellData?.startDate || 'March 2024'}</span>
            <span>Target: {wellData?.targetDate || 'December 2024'}</span>
          </div>
        </div>
      </div>
      {/* Community Impact Metrics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Community Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {impactMetrics?.map((metric, index) => (
            <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3 ${metric?.color}`}>
                <Icon name={metric?.icon} size={20} />
              </div>
              <p className="text-lg font-bold text-foreground">{metric?.value}</p>
              <p className="text-sm text-muted-foreground">{metric?.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            {
              icon: 'DollarSign',
              text: 'New investment of $2,500 received',
              time: '2 hours ago',
              color: 'text-success'
            },
            {
              icon: 'Settings',
              text: 'Pump maintenance completed successfully',
              time: '1 day ago',
              color: 'text-primary'
            },
            {
              icon: 'FileText',
              text: 'Monthly impact report generated',
              time: '3 days ago',
              color: 'text-secondary'
            },
            {
              icon: 'Users',
              text: '15 new families registered for water access',
              time: '1 week ago',
              color: 'text-warning'
            }
          ]?.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-muted/30 rounded-lg transition-smooth">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center ${activity?.color}`}>
                <Icon name={activity?.icon} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity?.text}</p>
                <p className="text-xs text-muted-foreground">{activity?.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WellOverviewTab;