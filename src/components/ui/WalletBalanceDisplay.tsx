'use client';

import React from 'react';
import { Wallet, RefreshCw, Coins, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWalletConnection, useWalletBalance } from '@/lib/wallet-context';
import { useUser } from '@/lib/auth/user-context';

interface Token {
  tokenId?: string;
  balance?: string | number;
}

interface WalletBalanceDisplayProps {
  showTokens?: boolean;
  compact?: boolean;
  className?: string;
}

export function WalletBalanceDisplay({ 
  showTokens = true, 
  compact = false, 
  className = '' 
}: WalletBalanceDisplayProps) {
  const { isConnected, accountId, state } = useWalletConnection();
  const { balance, tokens, refreshBalance } = useWalletBalance();
  const { user } = useUser();

  const formatAccountId = (accountId: string) => {
    if (!accountId) return 'Not connected';
    return `${accountId.slice(0, 8)}...${accountId.slice(-6)}`;
  };

  const formatBalance = (balance: number | null) => {
    if (balance === null) return 'N/A';
    return `${balance.toFixed(2)} ℏ`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Wallet className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">
            {isConnected ? formatBalance(balance) : 'Not connected'}
          </span>
        </div>
        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBalance}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Balance
          </div>
          {isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshBalance}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-green-100 text-green-800" : ""}
          >
            {state}
          </Badge>
        </div>

        {/* Account ID */}
        {accountId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Account:</span>
            <span className="text-sm font-mono">{formatAccountId(accountId)}</span>
          </div>
        )}

        {/* User Account Link */}
        {user?.hederaAccountId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Linked Account:</span>
            <span className="text-sm font-mono text-blue-600">
              {formatAccountId(user.hederaAccountId)}
            </span>
          </div>
        )}

        {/* HBAR Balance */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">HBAR Balance:</span>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-lg font-semibold">{formatBalance(balance)}</span>
          </div>
        </div>

        {/* User HBAR Balance from Database */}
        {user?.hbarBalance && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cached Balance:</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm">{user.hbarBalance} ℏ</span>
            </div>
          </div>
        )}

        {/* Token Holdings */}
        {showTokens && tokens && tokens.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-gray-600">Token Holdings:</span>
            <div className="space-y-1">
              {(tokens as Token[]).map((token, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-mono">{token.tokenId || `Token ${index + 1}`}</span>
                  <span>{token.balance || '0'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No tokens message */}
        {showTokens && isConnected && (!tokens || tokens.length === 0) && (
          <div className="text-center py-2">
            <span className="text-sm text-gray-500">No token holdings found</span>
          </div>
        )}

        {/* Not connected message */}
        {!isConnected && (
          <div className="text-center py-4">
            <span className="text-sm text-gray-500">
              Connect your wallet to view balance and holdings
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}