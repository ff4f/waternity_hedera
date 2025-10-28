import React from 'react';

interface SettlementStatusIndicatorProps {
  status: 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'EXECUTED' | 'FAILED' | 'REJECTED' | 'CANCELLED';
  className?: string;
}

const SettlementStatusIndicator: React.FC<SettlementStatusIndicatorProps> = ({ 
  status, 
  className = '' 
}) => {
  const steps = [
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'EXECUTED', label: 'Executed' }
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(step => step.key === stepKey);
    const currentIndex = steps.findIndex(step => step.key === status);
    
    if (status === 'FAILED' || status === 'REJECTED' || status === 'CANCELLED') {
      if (stepKey === 'REQUESTED') return 'completed';
      return 'failed';
    }
    
    if (status === 'DRAFT') {
      return 'pending';
    }
    
    if (stepIndex <= currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex + 1) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getStepStyles = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-blue-500 text-white border-blue-500';
      case 'failed':
        return 'bg-red-500 text-white border-red-500';
      case 'pending':
      default:
        return 'bg-gray-200 text-gray-600 border-gray-300';
    }
  };

  const getConnectorStyles = (fromStatus: string, toStatus: string) => {
    if (fromStatus === 'completed' && (toStatus === 'completed' || toStatus === 'current')) {
      return 'bg-green-500';
    } else if (fromStatus === 'completed' && toStatus === 'failed') {
      return 'bg-red-500';
    } else {
      return 'bg-gray-300';
    }
  };

  // Handle special statuses
  if (status === 'DRAFT') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-300">
          Draft
        </span>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full border border-red-300">
          Failed
        </span>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full border border-orange-300">
          Rejected
        </span>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-300">
          Cancelled
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.key);
        const isLast = index === steps.length - 1;
        const nextStepStatus = !isLast ? getStepStatus(steps[index + 1].key) : null;
        
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div 
                className={`px-2 py-1 text-xs font-medium rounded-full border transition-colors ${
                  getStepStyles(stepStatus)
                }`}
              >
                {step.label}
              </div>
            </div>
            
            {!isLast && (
              <div className="flex items-center mx-2">
                <div 
                  className={`h-0.5 w-8 transition-colors ${
                    getConnectorStyles(stepStatus, nextStepStatus || 'pending')
                  }`}
                />
                <div className="w-2 h-2 rounded-full bg-gray-300 mx-1" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SettlementStatusIndicator;