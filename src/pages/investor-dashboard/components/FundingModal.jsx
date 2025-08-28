import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const FundingModal = ({ isOpen, onClose, wellData, onFundingComplete }) => {
  const [fundingAmount, setFundingAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [step, setStep] = useState('input'); // input, processing, confirmation

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isProcessing]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setFundingAmount('');
      setStep('input');
      setTransactionHash('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen || !wellData) return null;

  const remainingFunding = wellData?.fundingGoal - wellData?.currentFunding;
  const minFunding = 100;
  const maxFunding = remainingFunding;

  const calculateProjectedAPY = () => {
    if (!fundingAmount || isNaN(fundingAmount)) return '0.0';
    const amount = parseFloat(fundingAmount);
    const baseAPY = parseFloat(wellData?.apy?.replace('%', ''));
    // Simulate slight APY variation based on funding amount
    const variation = (amount / 10000) * 0.1;
    return (baseAPY + variation)?.toFixed(1);
  };

  const calculateYearlyReturn = () => {
    if (!fundingAmount || isNaN(fundingAmount)) return '0';
    const amount = parseFloat(fundingAmount);
    const apy = parseFloat(calculateProjectedAPY());
    return ((amount * apy) / 100)?.toFixed(0);
  };

  const handleFundingSubmit = async () => {
    if (!fundingAmount || parseFloat(fundingAmount) < minFunding) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate HTS transfer process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock transaction hash
      const mockHash = `0x${Math.random()?.toString(16)?.substr(2, 40)}${Math.random()?.toString(16)?.substr(2, 24)}`;
      setTransactionHash(mockHash);
      setStep('confirmation');

      // Notify parent component
      if (onFundingComplete) {
        onFundingComplete({
          wellId: wellData?.id,
          amount: parseFloat(fundingAmount),
          transactionHash: mockHash
        });
      }
    } catch (error) {
      console.error('Funding failed:', error);
      setIsProcessing(false);
      setStep('input');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const renderInputStep = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Image
              src={wellData?.image}
              alt={wellData?.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Fund Well</h2>
            <p className="text-sm text-muted-foreground">{wellData?.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <Icon name="X" size={20} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Funding Progress */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Current Progress</span>
            <span className="text-foreground font-medium">
              ${wellData?.currentFunding?.toLocaleString()} / ${wellData?.fundingGoal?.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full"
              style={{ width: `${(wellData?.currentFunding / wellData?.fundingGoal) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ${remainingFunding?.toLocaleString()} remaining
          </div>
        </div>

        {/* Funding Amount Input */}
        <div>
          <Input
            label="Funding Amount (USDC)"
            type="number"
            placeholder={`Min: $${minFunding}`}
            value={fundingAmount}
            onChange={(e) => setFundingAmount(e?.target?.value)}
            min={minFunding}
            max={maxFunding}
            description={`Minimum: $${minFunding} • Maximum: $${maxFunding?.toLocaleString()}`}
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[500, 1000, 2500, 5000]?.map((amount) => (
            <Button
              key={amount}
              variant={fundingAmount === amount?.toString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFundingAmount(amount?.toString())}
              disabled={amount > remainingFunding}
            >
              ${amount}
            </Button>
          ))}
        </div>

        {/* Projected Returns */}
        {fundingAmount && parseFloat(fundingAmount) >= minFunding && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-3 flex items-center">
              <Icon name="TrendingUp" size={16} className="mr-2 text-success" />
              Projected Returns
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Projected APY</div>
                <div className="text-lg font-bold text-success">{calculateProjectedAPY()}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Yearly Return</div>
                <div className="text-lg font-bold text-success">${calculateYearlyReturn()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <p>
            By funding this well, you agree to the platform terms and understand that returns are subject to well performance and market conditions. All transactions are recorded on the Hedera blockchain for transparency.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border bg-muted/20">
        <div className="flex space-x-3">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={handleFundingSubmit}
            disabled={!fundingAmount || parseFloat(fundingAmount) < minFunding || parseFloat(fundingAmount) > maxFunding}
            iconName="DollarSign"
            iconPosition="left"
          >
            Fund ${fundingAmount || '0'}
          </Button>
        </div>
      </div>
    </>
  );

  const renderProcessingStep = () => (
    <>
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Processing Transaction</h2>
      </div>
      <div className="p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Confirming on Hedera Network</h3>
          <p className="text-muted-foreground">
            Your funding transaction is being processed. This may take a few moments.
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Funding Amount</div>
          <div className="text-xl font-bold text-foreground">${parseFloat(fundingAmount)?.toLocaleString()} USDC</div>
        </div>
      </div>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Funding Successful!</h2>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <Icon name="X" size={20} />
        </Button>
      </div>
      <div className="p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <Icon name="Check" size={32} className="text-success" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Transaction Confirmed</h3>
          <p className="text-muted-foreground">
            Your funding has been successfully processed and recorded on the blockchain.
          </p>
        </div>
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Amount Funded</div>
          <div className="text-xl font-bold text-success">${parseFloat(fundingAmount)?.toLocaleString()} USDC</div>
        </div>
        <ProofPillComponent 
          transactionHash={transactionHash}
          status="verified"
          showDetails={true}
          onVerificationClick={() => {}}
        />
      </div>
      <div className="p-6 border-t border-border bg-muted/20">
        <Button variant="default" fullWidth onClick={handleClose}>
          Continue to Dashboard
        </Button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal">
      <div className="bg-card rounded-lg shadow-modal max-w-md w-full max-h-[90vh] overflow-hidden">
        {step === 'input' && renderInputStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'confirmation' && renderConfirmationStep()}
      </div>
    </div>
  );
};

export default FundingModal;