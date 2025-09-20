import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const ProofPillComponent = ({ 
  hashscanUrl,
  mirrorUrl,
  status = 'verified',
  size = 'default',
  showDetails = false,
  onVerificationClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: 'Shield',
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          label: 'Verified'
        };
      case 'pending':
        return {
          icon: 'Clock',
          color: 'text-warning',
          bgColor: 'bg-warning/10', 
          borderColor: 'border-warning/20',
          label: 'Pending'
        };
      case 'failed':
        return {
          icon: 'AlertTriangle',
          color: 'text-error',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          label: 'Failed'
        };
      default:
        return {
          icon: 'Info',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          label: 'Unknown'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1.5 text-xs';
    }
  };

  const statusConfig = getStatusConfig();
  const sizeClasses = getSizeClasses();

  const handleClick = async () => {
    if (onVerificationClick) {
      setIsLoading(true);
      try {
        await onVerificationClick(transactionHash);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash?.slice(0, 6)}...${hash?.slice(-4)}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard?.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="inline-block">
      {/* Main Pill */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          inline-flex items-center rounded-full border transition-smooth
          ${statusConfig?.bgColor} ${statusConfig?.borderColor} ${statusConfig?.color}
          ${sizeClasses}
          hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isLoading ? (
          <Icon name="Loader2" size={size === 'sm' ? 12 : 14} className="animate-spin mr-1" />
        ) : (
          <Icon name={statusConfig?.icon} size={size === 'sm' ? 12 : 14} className="mr-1" />
        )}
        <span className="font-medium">{statusConfig?.label}</span>
        {showDetails && (
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={size === 'sm' ? 10 : 12} 
            className="ml-1" 
          />
        )}
      </button>
      {/* Expanded Details */}
      {isExpanded && showDetails && (
        <div className="mt-2 p-3 bg-card border border-border rounded-lg shadow-card min-w-[300px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Blockchain Verification</h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6"
              >
                <Icon name="X" size={12} />
              </Button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Transaction Hash</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded">
                    {formatHash(transactionHash)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(transactionHash)}
                    className="h-6 w-6 ml-2"
                  >
                    <Icon name="Copy" size={12} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <div className="flex items-center mt-1">
                  <Icon name={statusConfig?.icon} size={12} className={`mr-1 ${statusConfig?.color}`} />
                  <span className="text-xs text-foreground">{statusConfig?.label}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Verified At</label>
                <div className="text-xs text-foreground mt-1">
                  {new Date()?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-border">
              {hashscanUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(hashscanUrl, '_blank')}
                  iconName="ExternalLink"
                  iconPosition="right"
                  className="flex-1"
                >
                  View on HashScan
                </Button>
              )}
              {mirrorUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(mirrorUrl, '_blank')}
                  iconName="ExternalLink"
                  iconPosition="right"
                  className="flex-1"
                >
                  View on Mirror
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofPillComponent;