import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const PortfolioSidebar = ({ onSettleYield }) => {
  const [currentYield, setCurrentYield] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time yield updates every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentYield(prev => prev + Math.random() * 0.05);
      setLastUpdate(new Date());
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const portfolioData = {
    totalInvested: 15000,
    activeInvestments: 8,
    totalYield: 1247.50,
    pendingYield: currentYield + 23.45,
    nextSettlement: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
  };

  const recentInvestments = [
    {
      id: 1,
      wellName: "Ngong Hills Well #3",
      amount: 2500,
      apy: "9.2%",
      status: "active",
      transactionHash: "0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b"
    },
    {
      id: 2,
      wellName: "Kibera Community Well",
      amount: 1800,
      apy: "8.7%",
      status: "active",
      transactionHash: "0x8b8b8b4C4b8b8b8b532925a3b8D4C9db4C6634C0"
    },
    {
      id: 3,
      wellName: "Maasai Mara Well #1",
      amount: 3200,
      apy: "10.1%",
      status: "building",
      transactionHash: "0x4C9db4C4b8b8b8b532925a3b8D4C6634C0742d35C"
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const formatTime = (date) => {
    return date?.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="PieChart" size={20} className="mr-2 text-primary" />
          Portfolio Summary
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Invested</span>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(portfolioData?.totalInvested)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Active Investments</span>
            <span className="text-lg font-bold text-primary">
              {portfolioData?.activeInvestments}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Yield Earned</span>
            <span className="text-lg font-bold text-success">
              {formatCurrency(portfolioData?.totalYield)}
            </span>
          </div>
          
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Pending Yield</span>
              <span className="text-xl font-bold text-accent">
                {formatCurrency(portfolioData?.pendingYield)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              Last updated: {formatTime(lastUpdate)}
            </div>
            <Button
              variant="default"
              fullWidth
              onClick={onSettleYield}
              iconName="Zap"
              iconPosition="left"
            >
              Settle Now
            </Button>
          </div>
        </div>
      </div>
      {/* Yield Streaming Tracker */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="Activity" size={20} className="mr-2 text-success" />
          Yield Streaming
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-foreground">Live Streaming</span>
            </div>
            <span className="text-sm font-medium text-success">
              +${(currentYield * 0.1)?.toFixed(4)}/min
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Next auto-settlement: {formatTime(portfolioData?.nextSettlement)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Settlement Progress</span>
              <span className="text-foreground">67%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1">
              <div className="bg-success h-1 rounded-full w-2/3 transition-all duration-300"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Recent Investments */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Icon name="History" size={20} className="mr-2 text-secondary" />
          Recent Investments
        </h3>
        
        <div className="space-y-3">
          {recentInvestments?.map((investment) => (
            <div key={investment?.id} className="border border-border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {investment?.wellName}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(investment?.amount)}
                    </span>
                    <span className="text-xs font-medium text-success">
                      {investment?.apy}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  investment?.status === 'active' ?'text-success bg-success/10' :'text-warning bg-warning/10'
                }`}>
                  {investment?.status}
                </span>
                <ProofPillComponent 
                  transactionHash={investment?.transactionHash}
                  status="verified"
                  size="sm"
                  onVerificationClick={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
        
        <Button
          variant="outline"
          fullWidth
          className="mt-4"
          iconName="ArrowRight"
          iconPosition="right"
        >
          View All Investments
        </Button>
      </div>
    </div>
  );
};

export default PortfolioSidebar;