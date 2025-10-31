"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AccountId, AccountBalanceQuery } from '@hashgraph/sdk';
import { initializeHashConnect, connectToHashPack, getSigner } from '@/lib/wallet/connect';
import { createHederaClient } from '@/lib/hedera/client';
import { useUser } from '@/lib/auth/user-context';

const WalletContext = createContext({
  // Wallet state
  wallet: {
    connected: false,
    accountId: '',
    state: 'Disconnected',
    balance: null,
    tokens: [],
    error: null
  },
  // Actions
  connect: async () => {},
  disconnect: () => {},
  refreshBalance: async () => {},
  setWallet: () => {}
});

export function WalletProvider({ children, initial }) {
  const { user, updateHederaAccount } = useUser();
  
  const [wallet, setWallet] = useState(initial || {
    connected: false,
    accountId: '',
    state: 'Disconnected',
    balance: null,
    tokens: [],
    error: null
  });

  const [loading, setLoading] = useState(false);

  // Initialize wallet state from user data
  useEffect(() => {
    if (user?.hederaAccountId && !wallet.connected) {
      setWallet(prev => ({
        ...prev,
        accountId: user.hederaAccountId,
        // Don't auto-connect, just set the account ID
      }));
    }
  }, [user?.hederaAccountId, wallet.connected]);

  // Connect to wallet
  const connect = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setWallet(prev => ({ ...prev, state: 'Connecting', error: null }));

    try {
      // Initialize HashConnect
      await initializeHashConnect();
      
      // Connect to HashPack
      const accountId = await connectToHashPack();
      
      if (accountId) {
        const accountIdString = accountId.toString();
        
        setWallet(prev => ({
          ...prev,
          connected: true,
          accountId: accountIdString,
          state: 'Connected',
          error: null
        }));

        // Refresh balance after connection
        await refreshBalance(accountIdString);

        // Update user's Hedera account in database
        try {
          if (user && updateHederaAccount) {
            await updateHederaAccount(accountIdString);
          }
        } catch (error) {
          console.warn('Error updating user Hedera account:', error);
        }
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWallet(prev => ({
        ...prev,
        connected: false,
        state: 'Error',
        error: error.message || 'Failed to connect wallet'
      }));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      accountId: '',
      state: 'Disconnected',
      balance: null,
      tokens: [],
      error: null
    });
  }, []);

  // Refresh account balance
  const refreshBalance = useCallback(async (accountId = wallet.accountId) => {
    if (!accountId) return;

    try {
      // For client-side, we'll use a mock balance or fetch from API
      // In a real implementation, you'd use HashConnect to query balance
      const mockBalance = 100; // Mock HBAR balance
      const tokenBalances = [];

      setWallet(prev => ({
        ...prev,
        balance: mockBalance,
        tokens: tokenBalances
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      setWallet(prev => ({
        ...prev,
        error: 'Failed to refresh balance'
      }));
    }
  }, [wallet.accountId]);

  // Auto-refresh balance every 30 seconds when connected
  useEffect(() => {
    if (wallet.connected && wallet.accountId) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [wallet.connected, wallet.accountId, refreshBalance]);

  const value = useMemo(() => ({
    wallet,
    connect,
    disconnect,
    refreshBalance,
    setWallet,
    loading
  }), [wallet, connect, disconnect, refreshBalance, loading]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}

// Hook for wallet connection status
export function useWalletConnection() {
  const { wallet, connect, disconnect, loading } = useWalletContext();
  
  return {
    isConnected: wallet.connected,
    accountId: wallet.accountId,
    state: wallet.state,
    error: wallet.error,
    connect,
    disconnect,
    loading
  };
}

// Hook for wallet balance
export function useWalletBalance() {
  const { wallet, refreshBalance } = useWalletContext();
  
  return {
    balance: wallet.balance,
    tokens: wallet.tokens,
    refreshBalance
  };
}