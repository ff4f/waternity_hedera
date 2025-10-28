'use client';

import { useWallet } from '@/components/contexts/wallet-context';
import { Wallet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function WalletButton() {
  const { 
    isConnected, 
    accountId, 
    balance, 
    isConnecting, 
    error, 
    connect, 
    disconnect,
    refreshBalance 
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Wallet Error</span>
      </div>
    );
  }

  if (isConnected && accountId) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-800">
              {accountId.slice(0, 8)}...{accountId.slice(-6)}
            </span>
            {balance !== null && (
              <span className="text-xs text-green-600">
                {balance.toFixed(2)} HBAR
              </span>
            )}
          </div>
        </div>
        <button
          onClick={refreshBalance}
          className="text-gray-500 hover:text-gray-700 p-1"
          title="Refresh balance"
        >
          <Loader2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
}