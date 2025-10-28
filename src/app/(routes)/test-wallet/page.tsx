'use client';

import React from 'react';
import { useWalletContext, useWalletConnection, useWalletBalance } from '../../../lib/wallet-context';
import { WalletBalanceDisplay } from '../../../components/ui/WalletBalanceDisplay';
import WalletButton from '../../../components/ui/WalletButton';

interface Token {
  tokenId?: string;
  balance?: string | number;
}

export default function TestWalletPage() {
  const { wallet } = useWalletContext();
  const { connect, disconnect, loading } = useWalletConnection();
  const { balance, tokens, refreshBalance } = useWalletBalance();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Wallet Connection Test</h1>
        <WalletButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* New Wallet Balance Display Component */}
        <WalletBalanceDisplay className="lg:col-span-1" />
        
        {/* Original Wallet Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Wallet Status</h2>
        <div className="space-y-2">
          <p><strong>Connected:</strong> {wallet.connected ? 'Yes' : 'No'}</p>
          <p><strong>Account ID:</strong> {wallet.accountId || 'Not connected'}</p>
          <p><strong>State:</strong> {wallet.state}</p>
          <p><strong>Balance:</strong> {balance !== null ? `${balance} HBAR` : 'Not available'}</p>
          {wallet.error && (
            <p className="text-red-600"><strong>Error:</strong> {wallet.error}</p>
          )}
        </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Wallet Actions</h2>
        <div className="space-x-4">
          {!wallet.connected ? (
            <button
              onClick={connect}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="space-x-4">
              <button
                onClick={disconnect}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Disconnect Wallet
              </button>
              <button
                onClick={refreshBalance}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Refresh Balance
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Token Holdings</h2>
        {tokens && tokens.length > 0 ? (
          <div className="space-y-2">
            {(tokens as Token[]).map((token, index) => (
              <div key={index} className="flex justify-between">
                <span>Token ID: {token.tokenId || `Token ${index + 1}`}</span>
                <span>Balance: {token.balance || '0'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No tokens found</p>
        )}
      </div>
    </div>
  );
}