import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const WellInvestmentPanel = ({ wellData, userRole = 'investor' }) => {
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [isInvesting, setIsInvesting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [projectedAPY, setProjectedAPY] = useState(0);
  const [metaLinks, setMetaLinks] = useState({ hashscanUrl: '', mirrorUrl: '' });

  useEffect(() => {
    if (wellData?.id) {
      fetch(`/api/meta/links?wellId=${wellData.id}`)
        .then((res) => res.json())
        .then((data) => {
          setMetaLinks(data);
        });
    }
  }, [wellData?.id]);

  const minInvestment = 100;
  const maxInvestment = 10000;
  const currentFunding = parseInt(wellData?.currentFunding?.replace(/[$,]/g, '') || '32500');
  const fundingGoal = parseInt(wellData?.fundingGoal?.replace(/[$,]/g, '') || '50000');
  const remainingFunding = fundingGoal - currentFunding;

  // Calculate projected APY based on investment amount
  useEffect(() => {
    const dailyLiters = 5000;
    const tariffPerLiter = 0.0008;
    const investorShare = 0.4;
    const totalTVL = currentFunding + investmentAmount;
    
    const annualRevenue = dailyLiters * tariffPerLiter * 365 * investorShare;
    const userShare = (investmentAmount / totalTVL) * annualRevenue;
    const apy = (userShare / investmentAmount) * 100;
    
    setProjectedAPY(Math.min(apy, 12)); // Cap at 12%
  }, [investmentAmount, currentFunding]);

  const handleInvestmentChange = (e) => {
    const value = Math.max(minInvestment, Math.min(maxInvestment, parseInt(e?.target?.value) || 0));
    setInvestmentAmount(value);
  };

  const handleInvest = async () => {
    setIsInvesting(true);
    setShowWalletModal(true);
    
    // Simulate wallet confirmation and blockchain transaction
    setTimeout(() => {
      setIsInvesting(false);
      setShowWalletModal(false);
      // Could trigger success notification here
    }, 3000);
  };

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'operator':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Project Management</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="default" iconName="Settings" iconPosition="left" fullWidth>
                Update Status
              </Button>
              <Button variant="outline" iconName="Upload" iconPosition="left" fullWidth>
                Upload Docs
              </Button>
              <Button variant="outline" iconName="Activity" iconPosition="left" fullWidth>
                Device Status
              </Button>
              <Button variant="outline" iconName="FileText" iconPosition="left" fullWidth>
                Generate Report
              </Button>
            </div>
          </div>
        );
      
      case 'agent':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Settlement Controls</h3>
            <div className="space-y-3">
              <Button variant="default" iconName="Shield" iconPosition="left" fullWidth>
                Verify Milestone
              </Button>
              <Button variant="outline" iconName="Calculator" iconPosition="left" fullWidth>
                Calculate Settlement
              </Button>
              <Button variant="outline" iconName="Download" iconPosition="left" fullWidth>
                Audit Report
              </Button>
            </div>
          </div>
        );
      
      default: // investor
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Investment Details</h3>
            {/* Investment Amount Slider */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Investment Amount (USDC)</label>
              <div className="space-y-2">
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={handleInvestmentChange}
                  min={minInvestment}
                  max={Math.min(maxInvestment, remainingFunding)}
                  className="text-center text-lg font-semibold"
                />
                <input
                  type="range"
                  min={minInvestment}
                  max={Math.min(maxInvestment, remainingFunding)}
                  value={investmentAmount}
                  onChange={handleInvestmentChange}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${minInvestment}</span>
                  <span>${Math.min(maxInvestment, remainingFunding)}</span>
                </div>
              </div>
            </div>
            {/* APY Projection */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Projected APY</span>
                <span className="text-lg font-bold text-primary">{projectedAPY?.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Annual Return</span>
                <span className="text-sm font-medium text-success">
                  ${((investmentAmount * projectedAPY) / 100)?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Yield</span>
                <span className="text-sm font-medium text-foreground">
                  ${(((investmentAmount * projectedAPY) / 100) / 12)?.toFixed(2)}
                </span>
              </div>
            </div>
            {/* Investment Button */}
            <Button
              variant="default"
              fullWidth
              loading={isInvesting}
              onClick={handleInvest}
              iconName="DollarSign"
              iconPosition="left"
              disabled={investmentAmount < minInvestment || investmentAmount > remainingFunding}
            >
              {isInvesting ? 'Processing Investment...' : `Invest $${investmentAmount} USDC`}
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Minimum: ${minInvestment} • Remaining: ${remainingFunding?.toLocaleString()}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 sticky top-4">
        {/* Key Metrics */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-lg font-bold text-primary">{wellData?.apy || '8.5%'}</p>
              <p className="text-xs text-muted-foreground">Expected APY</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-lg font-bold text-success">{wellData?.dailyCapacity || '5,000L'}</p>
              <p className="text-xs text-muted-foreground">Daily Capacity</p>
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-lg font-bold text-foreground">{wellData?.familiesServed || '1,250'}</p>
            <p className="text-xs text-muted-foreground">Families Served</p>
          </div>
        </div>

        {/* Role-specific Content */}
        {getRoleSpecificContent()}

        {/* Blockchain Verification */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Blockchain Status</span>
            <ProofPillComponent 
              hashscanUrl={metaLinks.hashscanUrl}
              mirrorUrl={metaLinks.mirrorUrl}
              status="verified"
              size="sm"
              onVerificationClick={() => {}}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            All transactions are cryptographically verified on Hedera network
          </p>
        </div>
      </div>
      {/* Wallet Confirmation Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal">
          <div className="bg-card rounded-lg shadow-modal max-w-md w-full p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Icon name="Wallet" size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Investment</h3>
              <p className="text-muted-foreground">
                Please confirm the investment of ${investmentAmount} USDC in your connected wallet.
              </p>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Investment Amount:</span>
                  <span className="font-medium">${investmentAmount} USDC</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Network Fee:</span>
                  <span className="font-medium">~$0.0001</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                  <span>Total:</span>
                  <span>${(investmentAmount + 0.0001)?.toFixed(4)} USDC</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Icon name="Loader2" size={16} className="animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Waiting for wallet confirmation...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WellInvestmentPanel;