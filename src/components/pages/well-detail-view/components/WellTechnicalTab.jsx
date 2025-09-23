import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const WellTechnicalTab = ({ wellData }) => {
  const [expandedMilestone, setExpandedMilestone] = useState(null);

  const technicalSpecs = [
    {
      category: 'Well Construction',
      specs: [
        { label: 'Total Depth', value: wellData?.depth || '150 meters' },
        { label: 'Casing Diameter', value: wellData?.casingDiameter || '6 inches' },
        { label: 'Water Table Depth', value: wellData?.waterTableDepth || '45 meters' },
        { label: 'Static Water Level', value: wellData?.staticWaterLevel || '38 meters' }
      ]
    },
    {
      category: 'Pumping System',
      specs: [
        { label: 'Pump Type', value: wellData?.pumpType || 'Solar Submersible' },
        { label: 'Pump Capacity', value: wellData?.pumpCapacity || '2.5 HP' },
        { label: 'Flow Rate', value: wellData?.flowRate || '15 L/min' },
        { label: 'Head Pressure', value: wellData?.headPressure || '120 meters' }
      ]
    },
    {
      category: 'Water Quality',
      specs: [
        { label: 'pH Level', value: wellData?.phLevel || '7.2' },
        { label: 'TDS Level', value: wellData?.tdsLevel || '180 ppm' },
        { label: 'Chlorine Residual', value: wellData?.chlorineResidual || '0.5 mg/L' },
        { label: 'Bacterial Count', value: wellData?.bacterialCount || '< 1 CFU/100ml' }
      ]
    }
  ];

  const constructionMilestones = [
    {
      id: 1,
      title: 'Site Survey & Permits',
      description: 'Environmental assessment and regulatory approvals',
      status: 'completed',
      completionDate: '2024-03-15',
      percentage: 100,
      documents: ['Environmental Impact Assessment', 'Water Rights Permit', 'Construction License']
    },
    {
      id: 2,
      title: 'Drilling Operations',
      description: 'Well drilling and geological assessment',
      status: 'completed',
      completionDate: '2024-04-20',
      percentage: 100,
      documents: ['Drilling Log', 'Geological Survey', 'Water Quality Test']
    },
    {
      id: 3,
      title: 'Casing Installation',
      description: 'Well casing and screen installation',
      status: 'completed',
      completionDate: '2024-05-10',
      percentage: 100,
      documents: ['Casing Specifications', 'Installation Report', 'Pressure Test Results']
    },
    {
      id: 4,
      title: 'Pump Installation',
      description: 'Solar pump system and electrical connections',
      status: 'completed',
      completionDate: '2024-06-05',
      percentage: 100,
      documents: ['Pump Specifications', 'Electrical Schematic', 'Performance Test']
    },
    {
      id: 5,
      title: 'Meter & Valve Setup',
      description: 'Flow monitoring and control systems',
      status: 'completed',
      completionDate: '2024-06-25',
      percentage: 100,
      documents: ['Meter Calibration', 'Valve Configuration', 'Control System Manual']
    },
    {
      id: 6,
      title: 'Tariff Configuration',
      description: 'Payment system and rate structure setup',
      status: 'completed',
      completionDate: '2024-07-10',
      percentage: 100,
      documents: ['Tariff Schedule', 'Payment System Config', 'User Registration']
    },
    {
      id: 7,
      title: 'System Go-Live',
      description: 'Full operational status and community access',
      status: 'completed',
      completionDate: '2024-07-20',
      percentage: 100,
      documents: ['Commissioning Report', 'User Training Records', 'Operational Manual']
    },
    {
      id: 8,
      title: 'First 10k Liters',
      description: 'Initial production milestone verification',
      status: 'in-progress',
      completionDate: null,
      percentage: 85,
      documents: ['Production Log', 'Quality Monitoring', 'Revenue Tracking']
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'in-progress':
        return 'text-warning bg-warning/10';
      case 'pending':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
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

  return (
    <div className="space-y-6">
      {/* Equipment Specifications */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Equipment Specifications</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {technicalSpecs?.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              <h4 className="font-medium text-foreground border-b border-border pb-2">
                {category?.category}
              </h4>
              <div className="space-y-2">
                {category?.specs?.map((spec, specIndex) => (
                  <div key={specIndex} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{spec?.label}:</span>
                    <span className="text-foreground font-medium">{spec?.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Construction Milestones */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Construction Milestones</h3>
        <div className="space-y-4">
          {constructionMilestones?.map((milestone, index) => (
            <div key={milestone?.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(milestone?.status)}`}>
                    <Icon name={getStatusIcon(milestone?.status)} size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{milestone?.title}</h4>
                    <p className="text-sm text-muted-foreground">{milestone?.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{milestone?.percentage}%</p>
                    {milestone?.completionDate && (
                      <p className="text-xs text-muted-foreground">{milestone?.completionDate}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedMilestone(expandedMilestone === milestone?.id ? null : milestone?.id)}
                  >
                    <Icon name={expandedMilestone === milestone?.id ? "ChevronUp" : "ChevronDown"} size={16} />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    milestone?.status === 'completed' ? 'bg-success' : 
                    milestone?.status === 'in-progress' ? 'bg-warning' : 'bg-muted-foreground'
                  }`}
                  style={{ width: `${milestone?.percentage}%` }}
                />
              </div>

              {/* Expanded Details */}
              {expandedMilestone === milestone?.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h5 className="font-medium text-foreground mb-3">Documentation</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {milestone?.documents?.map((doc, docIndex) => (
                      <div key={docIndex} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Icon name="FileText" size={14} className="text-primary" />
                          <span className="text-sm text-foreground">{doc}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ProofPillComponent 
                            transactionHash={`0x${Math.random()?.toString(16)?.substr(2, 8)}...`}
                            status="verified"
                            size="sm"
                            onVerificationClick={() => {}}
                          />
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Icon name="Download" size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Regulatory Documentation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Regulatory Documentation</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              title: 'Environmental Compliance Certificate',
              issuer: 'Kenya Environmental Management Authority',
              validUntil: '2027-03-15',
              status: 'active',
              hash: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b'
            },
            {
              title: 'Water Abstraction License',
              issuer: 'Water Resources Authority',
              validUntil: '2029-07-20',
              status: 'active',
              hash: '0x8b8b8b8b4C9db4C4b8b8b8b742d35Cc6634C0532'
            },
            {
              title: 'Construction Permit',
              issuer: 'County Government of Kajiado',
              validUntil: '2025-12-31',
              status: 'active',
              hash: '0x532925a3b8D4C9db4C4b8b8b8b742d35Cc6634C0'
            },
            {
              title: 'Water Quality Certification',
              issuer: 'Kenya Bureau of Standards',
              validUntil: '2025-01-15',
              status: 'renewal-required',
              hash: '0xC0532925a3b8D4C9db4C4b8b8b8b742d35Cc6634'
            }
          ]?.map((doc, index) => (
            <div key={index} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-foreground">{doc?.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc?.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {doc?.status === 'active' ? 'Active' : 'Renewal Required'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{doc?.issuer}</p>
              <p className="text-sm text-muted-foreground mb-3">Valid until: {doc?.validUntil}</p>
              <div className="flex items-center justify-between">
                <ProofPillComponent 
                  transactionHash={doc?.hash}
                  status="verified"
                  size="sm"
                  showDetails={true}
                  onVerificationClick={() => {}}
                />
                <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WellTechnicalTab;