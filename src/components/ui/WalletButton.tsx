'use client';

import React, { useState } from 'react';
import { useWalletContext, useWalletConnection, useWalletBalance } from '../../lib/wallet-context';
import { Button } from '@/components/ui/button';
import Icon from '../AppIcon';

interface WalletButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showBalance?: boolean;
  showDisconnect?: boolean;
  className?: string;
}

const WalletButton: React.FC<WalletButtonProps> = ({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  showBalance = false,
  showDisconnect = true,
  className = '',
}) => {
  // Map shadcn button size: our 'md' corresponds to shadcn's 'default'
  const mappedSize: 'default' | 'sm' | 'lg' | 'icon' = size === 'md' ? 'default' : size;
  const { wallet } = useWalletContext();
  // Normalize and type the tokens locally to avoid `never[]` inference from the JS context default
  const tokenList: Array<{ tokenId?: string; balance?: number | string }> = Array.isArray(wallet.tokens)
    ? (wallet.tokens as Array<{ tokenId?: string; balance?: number | string }>)
    : [];
  const { connect, disconnect, loading } = useWalletConnection();
  const { balance, refreshBalance } = useWalletBalance();

  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Failed to connect wallet:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await disconnect();
      setShowDropdown(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      console.error('Failed to disconnect wallet:', err);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      setError(null);
      await refreshBalance();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh balance';
      setError(errorMessage);
      console.error('Failed to refresh balance:', err);
    }
  };

  const formatAccountId = (accountId: string) => {
    if (!accountId) return '';
    return `${accountId.slice(0, 8)}...${accountId.slice(-6)}`;
  };

  const formatBalance = (balance: number | null) => {
    if (balance === null) return 'Loading...';
    return `${balance.toLocaleString()} HBAR`;
  };

  // If wallet is not connected, show connect button
  // Use the correct property from wallet context (connected)
  if (!wallet.connected) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant={variant}
          size={mappedSize}
          onClick={handleConnect}
          disabled={loading}
          className={`${fullWidth ? 'w-full' : ''} flex items-center gap-2`}
        >
          <Icon name="Wallet" className="w-4 h-4" />
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </Button>
        
        {error && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-md z-10 shadow-lg">
            <div className="flex items-start space-x-2">
              <Icon name="AlertCircle" className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Connection Failed</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If wallet is connected, show wallet info with dropdown
  return (
    <div className={`relative ${className}`}>
      <Button
        variant={variant}
        size={mappedSize}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`justify-between flex items-center ${fullWidth ? 'w-full' : ''}`}
      >
        <Icon name="CheckCircle" className="w-4 h-4 mr-2" />
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {formatAccountId(wallet.accountId || '')}
          </span>
          {showBalance && (
            <span className="text-xs text-muted-foreground">
              {formatBalance(balance)}
            </span>
          )}
        </div>
        <Icon 
          name={showDropdown ? "ChevronUp" : "ChevronDown"} 
          className="w-4 h-4 ml-2" 
        />
      </Button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[280px]">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Account ID</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(wallet.accountId || '')}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 h-auto p-1"
              >
                <Icon name="Copy" className="w-3 h-3" />
                Copy
              </Button>
            </div>
            <p className="text-sm text-gray-900 font-mono break-all">
              {wallet.accountId}
            </p>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Balance</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshBalance}
                disabled={loading}
                className="text-xs flex items-center gap-1"
              >
                <Icon name="RefreshCw" className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {formatBalance(balance)}
            </p>
          </div>

          {tokenList && tokenList.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Token Holdings</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tokenList.map((token, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-mono text-xs">
                      {token?.tokenId || 'Unknown Token'}
                    </span>
                    <span className="font-medium">
                      {token?.balance ?? '0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start space-x-2">
                <Icon name="AlertCircle" className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {showDisconnect && (
            <div className="p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={loading}
                className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2 w-full"
              >
                <Icon name="LogOut" className="w-4 h-4" />
                {loading ? 'Disconnecting...' : 'Disconnect Wallet'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default WalletButton;