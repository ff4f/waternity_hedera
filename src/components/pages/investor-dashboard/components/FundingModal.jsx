import React, { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle, Loader } from 'lucide-react';

const FundingModal = ({ isOpen, onClose, well, onFund }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('input'); // input, processing, success

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setStep('input');
    }
  }, [isOpen]);

  if (!isOpen || !well) return null;

  const handleFund = () => {
    if (parseFloat(amount) > 0) {
      setStep('processing');
      // Simulate API call
      setTimeout(() => {
        onFund(well.id, parseFloat(amount));
        setStep('success');
      }, 2000);
    }
  };

  const projectedReturn = (parseFloat(amount) * (well.avgApy / 100)).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-modal w-full max-w-md m-auto">
        {step === 'input' && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Fund {well.name}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-6">You are about to invest in a decentralized water infrastructure project. Your funds will contribute to building and maintaining this well, providing clean water and generating returns.</p>
              
              <div className="mb-6">
                <label htmlFor="amount" className="text-sm font-medium text-muted-foreground mb-2 block">Investment Amount (USD)</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 500"
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {amount && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Projected APY</span>
                    <span className="font-semibold text-green-500 flex items-center">
                      <TrendingUp size={16} className="mr-1.5" /> {well.avgApy}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Projected Yearly Return</span>
                    <span className="font-semibold text-foreground">${projectedReturn}</span>
                  </div>
                </div>
              )}

              <button 
                onClick={handleFund}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                Confirm Investment
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader size={48} className="text-primary animate-spin mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Processing Transaction</h3>
            <p className="text-muted-foreground text-center">Please wait while we securely process your investment on the Hedera network. Do not close this window.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <CheckCircle size={48} className="text-green-500 mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Investment Successful!</h3>
            <p className="text-muted-foreground mb-8">Your ${amount} investment in {well.name} has been confirmed. You are now a stakeholder in this project.</p>
            <button 
              onClick={onClose}
              className="w-full max-w-xs bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors duration-300"
            >
              View My Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundingModal;