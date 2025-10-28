import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';
import { useWalletContext, useWalletConnection, useWalletBalance } from '../../../../lib/wallet-context';

const WellInvestmentPanel = ({ wellData, userRole = 'investor' }) => {
  // Wallet integration
  const { isConnected, accountId, connect, disconnect, loading, error: walletError } = useWalletConnection();
  const { balance, tokens } = useWalletBalance();
  
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
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsInvesting(true);
    try {
      // Call backend API to prepare investment
      const response = await fetch(`/api/wells/${wellData.id}/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: investmentAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to prepare investment');
      }

      const result = await response.json();

      // For now, we'll show success since the backend handles the investment
      // In a full implementation, you'd integrate with HashConnect for wallet signing
      alert('Investment prepared successfully! Please sign the transaction in your wallet.');
      
      // Refresh the page or update state
      window.location.reload();
    } catch (error) {
      console.error('Investment failed:', error);
      alert(`Investment failed: ${error.message}`);
    } finally {
      setIsInvesting(false);
    }
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Investment Details</h3>
              {isConnected && balance && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Wallet Balance</p>
                  <p className="text-sm font-medium text-foreground">{balance.hbar} HBAR</p>
                </div>
              )}
            </div>
            
            {/* Wallet Connection Status */}
            {!isConnected && (
              <div className="bg-muted/30 rounded-lg p-4 text-center space-y-3">
                <Icon name="Wallet" size={24} className="text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Connect Your Wallet</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Connect your Hedera wallet to start investing
                  </p>
                  <Button
                    onClick={connect}
                    loading={loading}
                    variant="default"
                    iconName="Wallet"
                    iconPosition="left"
                  >
                    {loading ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              </div>
            )}
            
            {walletError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{walletError}</p>
              </div>
            )}
            
            {isConnected && accountId && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} className="text-success" />
                  <div>
                    <p className="text-sm font-medium text-success">Wallet Connected</p>
                    <p className="text-xs text-muted-foreground">{accountId}</p>
                  </div>
                </div>
              </div>
            )}
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
              loading={isInvesting || isConnecting}
              onClick={handleInvest}
              iconName="DollarSign"
              iconPosition="left"
              disabled={
                !isConnected || 
                investmentAmount < minInvestment || 
                investmentAmount > remainingFunding ||
                loading
              }
            >
              {loading 
                ? 'Connecting Wallet...' 
                : isInvesting 
                  ? 'Processing Investment...' 
                  : !isConnected 
                    ? 'Connect Wallet to Invest'
                    : `Invest $${investmentAmount.toLocaleString()}`
              }
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
                Please confirm the investment of ${investmentAmount} USDC from your connected wallet.
              </p>
              
              {isConnected && accountId && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>From Account:</strong> {accountId}
                </p>
              )}
              
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Investment Amount:</span>
                  <span className="font-medium">${investmentAmount} USDC</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Network Fee:</span>
                  <span className="font-medium">~0.0001 HBAR</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Well:</span>
                  <span className="font-medium">{wellData?.name || 'Water Well'}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                  <span>Expected APY:</span>
                  <span className="text-primary">{projectedAPY?.toFixed(2)}%</span>
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