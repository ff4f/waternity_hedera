import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';
import { sendTransaction } from '../../../lib/wallet/connect';
import { Transaction, AccountId } from '@hashgraph/sdk';

const SettlementCalculator = () => {
  const [settlements, setSettlements] = useState([
    {
      id: 'SETTLE-001',
      wellId: 'WELL-NE-001',
      wellName: 'Ngong Hills Community Well',
      period: '2024-08-20 to 2024-08-25',
      totalRevenue: 2450.75,
      litersConsumed: 3063,
      tariffRate: 0.0008,
      splits: {
        operator: 1225.38, // 50%
        investor: 980.30,   // 40%
        platform: 245.07   // 10%
      },
      status: 'pending',
      lastProcessed: null,
      transactionHashes: null
    },
    {
      id: 'SETTLE-002',
      wellId: 'WELL-NE-002',
      wellName: 'Kibera Access Point',
      period: '2024-08-20 to 2024-08-25',
      totalRevenue: 1876.50,
      litersConsumed: 2345,
      tariffRate: 0.0008,
      splits: {
        operator: 938.25,
        investor: 750.60,
        platform: 187.65
      },
      status: 'completed',
      lastProcessed: '2024-08-25T16:45:00Z',
      transactionHashes: {
        operator: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b',
        investor: '0x8b8b8b4C4b8b8b8bC0532925a3b8D4C9db4C742d35',
        platform: '0x925a3b8D4C9db4C4b8b8b8b742d35Cc6634C0532'
      }
    }
  ]);

  const [selectedSettlement, setSelectedSettlement] = useState(settlements?.[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSettlement, setAutoSettlement] = useState(true);

  const processSettlement = async (settlementId) => {
    setIsProcessing(true);

    try {
      // 1. Fetch settlement data from your backend
      const response = await fetch('/api/settlement/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settlement data');
      }

      const { distributionResult } = await response.json();
      const { results } = distributionResult;

      // 2. Process each transaction
      const executedTransactions = [];
      for (const result of results) {
        const { transaction, accountId } = result;

        // 3. Reconstruct and sign the transaction
        const tx = Transaction.fromBytes(Buffer.from(transaction, 'base64'));
        const txId = await sendTransaction(tx, AccountId.fromString(accountId));

        executedTransactions.push({ account: accountId, txId });
      }

      // 4. Execute settlement
      const executeResponse = await fetch('/api/settlement/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementId, executedTransactions }),
      });

      if (!executeResponse.ok) {
        throw new Error('Failed to execute settlement');
      }

      const updatedSettlement = await executeResponse.json();

      // 5. Update UI
      setSettlements(prev => prev.map(settlement =>
        settlement.id === settlementId ? updatedSettlement : settlement
      ));

      if (selectedSettlement?.id === settlementId) {
        setSelectedSettlement(updatedSettlement);
      }

    } catch (error) {
      console.error("Settlement processing failed:", error);
      // Optionally, update UI to show an error state
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'pending':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  // Auto-settlement simulation
  useEffect(() => {
    if (!autoSettlement) return;

    const interval = setInterval(() => {
      const pendingSettlements = settlements?.filter(s => s?.status === 'pending');
      if (pendingSettlements?.length > 0 && !isProcessing) {
        const randomSettlement = pendingSettlements?.[Math.floor(Math.random() * pendingSettlements?.length)];
        processSettlement(randomSettlement?.id);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [settlements, autoSettlement, isProcessing]);

  return (
    <div className="bg-card rounded-lg border border-border p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Icon name="Calculator" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Settlement Calculator</h3>
            <p className="text-sm text-muted-foreground">Automated revenue distribution with 5-minute intervals</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoSettlement}
              onChange={(e) => setAutoSettlement(e?.target?.checked)}
              className="rounded border-border"
            />
            <span className="text-foreground">Auto Settlement</span>
          </label>
        </div>
      </div>
      {/* Settlement Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Select Settlement</label>
        <select
          value={selectedSettlement?.id}
          onChange={(e) => setSelectedSettlement(settlements?.find(s => s?.id === e?.target?.value))}
          className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {settlements?.map(settlement => (
            <option key={settlement?.id} value={settlement?.id}>
              {settlement?.wellName} - {settlement?.period}
            </option>
          ))}
        </select>
      </div>
      {/* Revenue Summary */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-foreground">Revenue Summary</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSettlement?.status)}`}>
            {selectedSettlement?.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              ${selectedSettlement?.totalRevenue?.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {selectedSettlement?.litersConsumed?.toLocaleString()}L
            </div>
            <div className="text-sm text-muted-foreground">Liters Consumed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              ${selectedSettlement?.tariffRate}
            </div>
            <div className="text-sm text-muted-foreground">Per Liter</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              5min
            </div>
            <div className="text-sm text-muted-foreground">Interval</div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Period: {selectedSettlement?.period}
        </div>
      </div>
      {/* Revenue Splits */}
      <div className="mb-6 space-y-4">
        <h4 className="font-semibold text-foreground">Revenue Distribution</h4>
        
        <div className="space-y-3">
          {/* Operator Split */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div>
                <div className="font-medium text-foreground">Operator (50%)</div>
                <div className="text-sm text-muted-foreground">Ngong Hills Water Co-op</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">
                ${selectedSettlement?.splits?.operator?.toFixed(2)}
              </div>
              {selectedSettlement?.transactionHashes?.operator && (
                <ProofPillComponent
                  transactionHash={selectedSettlement?.transactionHashes?.operator}
                  status="verified"
                  size="sm"
                  onVerificationClick={() => {}}
                />
              )}
            </div>
          </div>

          {/* Investor Split */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <div>
                <div className="font-medium text-foreground">Investors (40%)</div>
                <div className="text-sm text-muted-foreground">Distributed to token holders</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">
                ${selectedSettlement?.splits?.investor?.toFixed(2)}
              </div>
              {selectedSettlement?.transactionHashes?.investor && (
                <ProofPillComponent
                  transactionHash={selectedSettlement?.transactionHashes?.investor}
                  status="verified"
                  size="sm"
                  onVerificationClick={() => {}}
                />
              )}
            </div>
          </div>

          {/* Platform Split */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <div>
                <div className="font-medium text-foreground">Platform (10%)</div>
                <div className="text-sm text-muted-foreground">Waternity protocol fee</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-foreground">
                ${selectedSettlement?.splits?.platform?.toFixed(2)}
              </div>
              {selectedSettlement?.transactionHashes?.platform && (
                <ProofPillComponent
                  transactionHash={selectedSettlement?.transactionHashes?.platform}
                  status="verified"
                  size="sm"
                  onVerificationClick={() => {}}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Settlement Actions */}
      <div className="space-y-4">
        {selectedSettlement?.status === 'pending' && (
          <Button
            variant="default"
            onClick={() => processSettlement(selectedSettlement?.id)}
            disabled={isProcessing}
            loading={isProcessing}
            iconName="Play"
            iconPosition="left"
            fullWidth
          >
            Process Settlement Now
          </Button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            fullWidth
          >
            Export Report
          </Button>
          <Button
            variant="outline"
            iconName="RefreshCw"
            iconPosition="left"
            fullWidth
          >
            Recalculate
          </Button>
        </div>

        {selectedSettlement?.lastProcessed && (
          <div className="text-sm text-muted-foreground text-center">
            Last processed: {new Date(selectedSettlement.lastProcessed)?.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementCalculator;