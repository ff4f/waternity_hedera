'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  htsService, 
  TokenInfo, 
  TokenBalance, 
  TokenTransfer, 
  CreateTokenParams 
} from '@/lib/tokens/hts-service';

export interface UseHTSReturn {
  // State
  loading: boolean;
  error: string | null;
  tokens: TokenInfo[];
  balances: TokenBalance[];
  
  // Actions
  createToken: (params: CreateTokenParams) => Promise<TokenInfo | null>;
  getTokenInfo: (tokenId: string) => Promise<TokenInfo | null>;
  associateToken: (accountId: string, tokenId: string) => Promise<void>;
  transferToken: (transfer: TokenTransfer) => Promise<void>;
  getAccountBalances: (accountId: string) => Promise<void>;
  createWaterToken: () => Promise<TokenInfo | null>;
  createRewardToken: () => Promise<TokenInfo | null>;
  distributeRewards: (
    rewardTokenId: string,
    recipients: Array<{ accountId: string; amount: number; reason: string }>
  ) => Promise<void>;
}

export function useHTS(): UseHTSReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);

  const handleError = useCallback((err: any, action: string) => {
    console.error(`Error in ${action}:`, err);
    setError(err.message || `Failed to ${action}`);
    setLoading(false);
  }, []);

  const createToken = useCallback(async (params: CreateTokenParams): Promise<TokenInfo | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const tokenInfo = await htsService.createToken(params);
      setTokens(prev => [...prev, tokenInfo]);
      setLoading(false);
      return tokenInfo;
    } catch (err) {
      handleError(err, 'create token');
      return null;
    }
  }, [handleError]);

  const getTokenInfo = useCallback(async (tokenId: string): Promise<TokenInfo | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const tokenInfo = await htsService.getTokenInfo(tokenId);
      
      // Update tokens list if not already present
      setTokens(prev => {
        const exists = prev.find(t => t.tokenId === tokenId);
        if (!exists) {
          return [...prev, tokenInfo];
        }
        return prev.map(t => t.tokenId === tokenId ? tokenInfo : t);
      });
      
      setLoading(false);
      return tokenInfo;
    } catch (err) {
      handleError(err, 'get token info');
      return null;
    }
  }, [handleError]);

  const associateToken = useCallback(async (accountId: string, tokenId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await htsService.associateToken(accountId, tokenId);
      setLoading(false);
    } catch (err) {
      handleError(err, 'associate token');
    }
  }, [handleError]);

  const transferToken = useCallback(async (transfer: TokenTransfer): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await htsService.transferToken(transfer);
      setLoading(false);
    } catch (err) {
      handleError(err, 'transfer token');
    }
  }, [handleError]);

  const getAccountBalances = useCallback(async (accountId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const accountBalances = await htsService.getAccountTokenBalances(accountId);
      setBalances(accountBalances);
      setLoading(false);
    } catch (err) {
      handleError(err, 'get account balances');
    }
  }, [handleError]);

  const createWaterToken = useCallback(async (): Promise<TokenInfo | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const tokenInfo = await htsService.createWaterToken();
      setTokens(prev => [...prev, tokenInfo]);
      setLoading(false);
      return tokenInfo;
    } catch (err) {
      handleError(err, 'create water token');
      return null;
    }
  }, [handleError]);

  const createRewardToken = useCallback(async (): Promise<TokenInfo | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const tokenInfo = await htsService.createRewardToken();
      setTokens(prev => [...prev, tokenInfo]);
      setLoading(false);
      return tokenInfo;
    } catch (err) {
      handleError(err, 'create reward token');
      return null;
    }
  }, [handleError]);

  const distributeRewards = useCallback(async (
    rewardTokenId: string,
    recipients: Array<{ accountId: string; amount: number; reason: string }>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await htsService.distributeRewards(rewardTokenId, recipients);
      setLoading(false);
    } catch (err) {
      handleError(err, 'distribute rewards');
    }
  }, [handleError]);

  return {
    loading,
    error,
    tokens,
    balances,
    createToken,
    getTokenInfo,
    associateToken,
    transferToken,
    getAccountBalances,
    createWaterToken,
    createRewardToken,
    distributeRewards
  };
}

// Hook for managing water payment tokens
export function useWaterToken() {
  const hts = useHTS();
  
  const waterTokens = hts.tokens.filter(token => 
    token.symbol === 'WATER' || token.name.includes('Waternity Token')
  );
  
  return {
    ...hts,
    waterTokens,
    createWaterToken: hts.createWaterToken
  };
}

// Hook for managing reward tokens
export function useRewardToken() {
  const hts = useHTS();
  
  const rewardTokens = hts.tokens.filter(token => 
    token.symbol === 'REWARD' || token.name.includes('Waternity Rewards')
  );
  
  return {
    ...hts,
    rewardTokens,
    createRewardToken: hts.createRewardToken,
    distributeRewards: hts.distributeRewards
  };
}

// Hook for token balances with automatic refresh
export function useTokenBalances(accountId?: string) {
  const hts = useHTS();
  
  useEffect(() => {
    if (accountId) {
      hts.getAccountBalances(accountId);
    }
  }, [accountId, hts]);
  
  const refreshBalances = useCallback(() => {
    if (accountId) {
      hts.getAccountBalances(accountId);
    }
  }, [accountId, hts]);
  
  return {
    ...hts,
    refreshBalances
  };
}