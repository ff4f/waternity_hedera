import React from 'react';
import { PieChart, DollarSign, Zap, Clock } from 'lucide-react';

const PortfolioSidebar = ({ stats, onSettle }) => {
  const { totalInvested, activeWells, totalYield, availableYield } = stats;

  return (
    <div className="bg-card p-6 rounded-lg border border-border space-y-8">
      {/* Portfolio Summary */}
      <div>
        <div className="flex items-center mb-6">
          <PieChart size={20} className="mr-3 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">My Portfolio</h3>
        </div>
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Invested</span>
            <span className="font-semibold text-foreground">${totalInvested.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Active Wells</span>
            <span className="font-semibold text-foreground">{activeWells}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Lifetime Yield</span>
            <span className="font-semibold text-green-500">+${totalYield.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Yield Settlement */}
      <div className="bg-muted/50 border border-border rounded-lg p-5">
        <div className="flex items-center mb-4">
          <Zap size={18} className="mr-3 text-yellow-500" />
          <h4 className="font-semibold text-foreground">Available Yield</h4>
        </div>
        <div className="mb-5">
          <p className="text-3xl font-bold text-foreground">${availableYield.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Ready to be settled to your wallet.</p>
        </div>
        <button 
          onClick={onSettle}
          className="w-full bg-yellow-500 text-yellow-900 font-semibold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors duration-300"
        >
          Settle Yield
        </button>
        <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
          <Clock size={12} className="mr-1.5" />
          <span>Next settlement in 2h 15m</span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSidebar;