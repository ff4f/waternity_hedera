import { useState, useEffect, useCallback } from 'react';
import { 
  ConservationRewardsService, 
  ConservationActivity, 
  Achievement, 
  UserLevel, 
  LeaderboardEntry 
} from '@/lib/rewards/conservation-rewards';

const rewardsService = new ConservationRewardsService();

export function useConservationRewards() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordActivity = useCallback(async (activity: Omit<ConservationActivity, 'id' | 'timestamp' | 'rewardPoints' | 'tokenReward'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await rewardsService.recordActivity(activity);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record activity');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recordActivity,
    loading,
    error
  };
}

export function useUserLevel(userId: string) {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserLevel = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const level = await rewardsService.getUserLevel(userId);
      setUserLevel(level);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user level');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserLevel();
  }, [fetchUserLevel]);

  return {
    userLevel,
    loading,
    error,
    refetch: fetchUserLevel
  };
}

export function useUserProgress(userId: string) {
  const [progress, setProgress] = useState<{
    currentLevel: UserLevel;
    nextLevel: UserLevel | null;
    progress: number;
    pointsToNext: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const progressData = await rewardsService.getNextLevelProgress(userId);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user progress');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress
  };
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const availableAchievements = rewardsService.getAvailableAchievements();
    setAchievements(availableAchievements);
    setLoading(false);
  }, []);

  return {
    achievements,
    loading
  };
}

export function useUserAchievements(userId: string) {
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAchievements = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In real implementation, this would fetch user's achievements from database
      // For now, return mock data
      const mockAchievements = rewardsService.getAvailableAchievements().slice(0, 3);
      setUserAchievements(mockAchievements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user achievements');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserAchievements();
  }, [fetchUserAchievements]);

  return {
    userAchievements,
    loading,
    error,
    refetch: fetchUserAchievements
  };
}

export function useLeaderboard(timeframe: 'weekly' | 'monthly' | 'all_time' = 'all_time', limit: number = 50) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await rewardsService.getLeaderboard(timeframe, limit);
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [timeframe, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard
  };
}

export function useUserStats(userId: string) {
  const [stats, setStats] = useState<{
    totalActivities: number;
    totalWaterSaved: number;
    currentStreak: number;
    communityHelps: number;
    totalPoints: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userStats = await rewardsService.getUserStats(userId);
      setStats(userStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

export function useUserLevels() {
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const userLevels = rewardsService.getUserLevels();
    setLevels(userLevels);
    setLoading(false);
  }, []);

  return {
    levels,
    loading
  };
}