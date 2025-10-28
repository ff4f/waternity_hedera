import React from 'react';
import { hashscanTopicUrl, hashscanMessageUrl } from '@/lib/hedera/links';
import WalletConnectNotice from '@/components/WalletConnectNotice';

// Define the steps in the settlement wizard
type Step = 'request' | 'approve' | 'execute' | 'mint';

// Define the settlement data structure
interface SettlementData {
  id?: string;
  status?: string;
  transactionId?: string;
  messageId?: string;
  topicId?: string;
  tokenId?: string;
  payouts?: Array<{
    recipientAccount: string;
    amount: number;
    assetType: 'HBAR' | 'TOKEN';
    transactionId?: string;
  }>;
}

// Define the props for the SettlementWizard component
type SettlementWizardProps = {
  wellId: string;
};

const SettlementWizard: React.FC<SettlementWizardProps> = ({ wellId }) => {
  const [currentStep, setCurrentStep] = React.useState<Step>('request');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [settlementData, setSettlementData] = React.useState<SettlementData>({});
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isWalletConnected, setIsWalletConnected] = React.useState(false);

  // Check wallet connection status
  React.useEffect(() => {
    // Mock wallet connection check - replace with actual wallet service
    const checkWalletConnection = () => {
      // This should be replaced with actual wallet connection check
      const connected = localStorage.getItem('hedera-wallet-connected') === 'true';
      setIsWalletConnected(connected);
    };
    
    checkWalletConnection();
  }, []);

  // Show notification for 5 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const requestData = {
        messageId: crypto.randomUUID(),
        wellId,
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        periodEnd: new Date().toISOString(),
        kwhTotal: 1000,
        grossRevenue: 500.00,
        payouts: [
          {
            recipientAccount: '0.0.123456',
            assetType: 'HBAR' as const,
            amount: 250.00
          },
          {
            recipientAccount: '0.0.789012',
            assetType: 'HBAR' as const,
            amount: 250.00
          }
        ]
      };

      const response = await fetch('/api/settlements/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': requestData.messageId
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request settlement');
      }

      const result = await response.json();
      setSettlementData({
        id: result.data.settlementId,
        messageId: result.data.messageId,
        transactionId: result.data.transactionId,
        topicId: result.data.topicId,
        status: 'REQUESTED'
      });
      
      showNotification('success', 'Settlement requested successfully!');
      setCurrentStep('approve');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showNotification('error', `Request failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!settlementData.id) {
      showNotification('error', 'No settlement to approve');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const approveData = {
        messageId: crypto.randomUUID(),
        settlementId: settlementData.id
      };

      const response = await fetch('/api/settlements/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': approveData.messageId
        },
        body: JSON.stringify(approveData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve settlement');
      }

      const result = await response.json();
      setSettlementData(prev => ({
        ...prev,
        status: 'APPROVED',
        transactionId: result.data.transactionId
      }));
      
      showNotification('success', 'Settlement approved successfully!');
      setCurrentStep('execute');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showNotification('error', `Approval failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!settlementData.id) {
      showNotification('error', 'No settlement to execute');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const executeData = {
        messageId: crypto.randomUUID(),
        settlementId: settlementData.id,
        assetType: 'HBAR' as const
      };

      const response = await fetch('/api/settlements/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': executeData.messageId
        },
        body: JSON.stringify(executeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute settlement');
      }

      const result = await response.json();
      setSettlementData(prev => ({
        ...prev,
        status: 'EXECUTED',
        transactionId: result.data.transactionId,
        tokenId: result.data.tokenId,
        payouts: result.data.payouts
      }));
      
      showNotification('success', 'Settlement executed successfully!');
      setCurrentStep('mint');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showNotification('error', `Execution failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!settlementData.tokenId) {
      showNotification('info', 'Token already created during execution');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const mintData = {
        tokenId: settlementData.tokenId,
        amount: 1000,
        messageId: crypto.randomUUID()
      };

      const response = await fetch('/api/hts/tokens?action=mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': mintData.messageId
        },
        body: JSON.stringify(mintData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mint tokens');
      }

      const result = await response.json();
      showNotification('success', `Minted ${mintData.amount} tokens successfully!`);
      
      // Reset wizard or show completion state
      setTimeout(() => {
        setCurrentStep('request');
        setSettlementData({});
        setError(null);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      showNotification('error', `Minting failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Show wallet connect notice if wallet is not connected
  if (!isWalletConnected) {
    return (
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Settlement Wizard</h3>
        <WalletConnectNotice 
           show={true}
           message="Connect your Hedera wallet to proceed with settlement operations"
           className="mb-4"
         />
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-2">Settlement Wizard</h3>
      
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-3 rounded-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === 'success' ? '✅' :
               notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            {notification.message}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2">❌</span>
            Error: {error}
          </div>
        </div>
      )}

      {/* Settlement Status */}
      {settlementData.id && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-2">Settlement Status</h4>
          <div className="space-y-2 text-sm">
            <div><strong>ID:</strong> {settlementData.id}</div>
            <div><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                settlementData.status === 'REQUESTED' ? 'bg-blue-100 text-blue-800' :
                settlementData.status === 'APPROVED' ? 'bg-yellow-100 text-yellow-800' :
                settlementData.status === 'EXECUTED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {settlementData.status}
              </span>
            </div>
            {settlementData.transactionId && (
              <div><strong>Transaction ID:</strong> {settlementData.transactionId}</div>
            )}
            {settlementData.topicId && (
              <div>
                <strong>Topic:</strong> 
                <a 
                  href={hashscanTopicUrl(settlementData.topicId)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  View on HashScan
                </a>
              </div>
            )}
            {settlementData.tokenId && (
              <div><strong>Token ID:</strong> {settlementData.tokenId}</div>
            )}
            {settlementData.payouts && settlementData.payouts.length > 0 && (
              <div>
                <strong>Payouts:</strong>
                <ul className="mt-1 ml-4 space-y-1">
                  {settlementData.payouts.map((payout, index) => (
                    <li key={index} className="text-xs">
                      {payout.recipientAccount}: {payout.amount} {payout.assetType}
                      {payout.transactionId && (
                        <span className="ml-2 text-blue-600">({payout.transactionId})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {currentStep === 'request' && (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            {loading && <span className="mr-2 animate-spin">⏳</span>}
            Request Settlement
          </button>
        )}
        {currentStep === 'approve' && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-700 disabled:bg-yellow-300 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            {loading && <span className="mr-2 animate-spin">⏳</span>}
            Approve Settlement
          </button>
        )}
        {currentStep === 'execute' && (
          <button
            onClick={handleExecute}
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            {loading && <span className="mr-2 animate-spin">⏳</span>}
            Execute Settlement
          </button>
        )}
        {currentStep === 'mint' && (
          <button
            onClick={handleMint}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            {loading && <span className="mr-2 animate-spin">⏳</span>}
            Mint Token (Demo)
          </button>
        )}
        
        {/* Reset Button */}
        {(currentStep !== 'request' || settlementData.id) && (
          <button
            onClick={() => {
              setCurrentStep('request');
              setSettlementData({});
              setError(null);
              setNotification(null);
            }}
            disabled={loading}
            className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default SettlementWizard;