/**
 * React hooks for Water Management Smart Contract
 * Provides easy-to-use hooks for frontend components
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  waterManagementService, 
  WellInfo, 
  WaterAllocation, 
  QualityData, 
  ConservationMetrics, 
  ContractStats 
} from '../contracts/water-management-service';

// Hook for getting well information
export function useWellInfo(wellId: number | null) {
  const [wellInfo, setWellInfo] = useState<WellInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWellInfo = useCallback(async () => {
    if (!wellId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const info = await waterManagementService.getWellInfo(wellId);
      setWellInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch well info');
    } finally {
      setLoading(false);
    }
  }, [wellId]);

  useEffect(() => {
    fetchWellInfo();
  }, [fetchWellInfo]);

  return { wellInfo, loading, error, refetch: fetchWellInfo };
}

// Hook for getting user water allocation
export function useWaterAllocation(wellId: number | null, userAddress: string | null) {
  const [allocation, setAllocation] = useState<WaterAllocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocation = useCallback(async () => {
    if (!wellId || !userAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const alloc = await waterManagementService.getUserWaterAllocation(wellId, userAddress);
      setAllocation(alloc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch allocation');
    } finally {
      setLoading(false);
    }
  }, [wellId, userAddress]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation]);

  return { allocation, loading, error, refetch: fetchAllocation };
}

// Hook for getting quality history
export function useQualityHistory(wellId: number | null, limit: number = 10) {
  const [qualityData, setQualityData] = useState<QualityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQualityHistory = useCallback(async () => {
    if (!wellId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await waterManagementService.getQualityHistory(wellId, limit);
      setQualityData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quality history');
    } finally {
      setLoading(false);
    }
  }, [wellId, limit]);

  useEffect(() => {
    fetchQualityHistory();
  }, [fetchQualityHistory]);

  return { qualityData, loading, error, refetch: fetchQualityHistory };
}

// Hook for getting conservation metrics
export function useConservationMetrics(userAddress: string | null) {
  const [metrics, setMetrics] = useState<ConservationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!userAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await waterManagementService.getConservationMetrics(userAddress);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conservation metrics');
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

// Hook for getting contract statistics
export function useContractStats() {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await waterManagementService.getContractStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contract stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook for well registration
export function useWellRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const registerWell = useCallback(async (location: string, capacity: number, pricePerLiter: number) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await waterManagementService.registerWell(location, capacity, pricePerLiter);
      setTxHash(hash);
      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register well';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { registerWell, loading, error, txHash };
}

// Hook for water allocation
export function useWaterAllocationAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const allocateWater = useCallback(async (wellId: number, userAddress: string, amount: number, duration: number) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await waterManagementService.allocateWater(wellId, userAddress, amount, duration);
      setTxHash(hash);
      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to allocate water';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { allocateWater, loading, error, txHash };
}

// Hook for recording water usage
export function useWaterUsage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const recordUsage = useCallback(async (wellId: number, userAddress: string, amount: number) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await waterManagementService.recordWaterUsage(wellId, userAddress, amount);
      setTxHash(hash);
      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record water usage';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recordUsage, loading, error, txHash };
}

// Hook for submitting quality data
export function useQualitySubmission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const submitQualityData = useCallback(async (wellId: number, ph: number, tds: number, turbidity: number) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await waterManagementService.submitQualityData(wellId, ph, tds, turbidity);
      setTxHash(hash);
      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit quality data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitQualityData, loading, error, txHash };
}

// Hook for recording conservation
export function useConservationRecording() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const recordConservation = useCallback(async (userAddress: string, waterSaved: number, reason: string) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await waterManagementService.recordConservation(userAddress, waterSaved, reason);
      setTxHash(hash);
      return hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record conservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recordConservation, loading, error, txHash };
}