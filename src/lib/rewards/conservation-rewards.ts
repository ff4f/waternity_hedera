import HTSService from '@/lib/tokens/hts-service';
import { WaterManagementService } from '@/lib/contracts/water-management-service';

export interface ConservationActivity {
  id: string;
  userId: string;
  activityType: 'water_saving' | 'quality_improvement' | 'leak_detection' | 'education' | 'community_action';
  description: string;
  waterSaved: number; // in liters
  qualityImprovement?: number; // percentage
  timestamp: Date;
  verified: boolean;
  rewardPoints: number;
  tokenReward: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  evidence?: {
    photos: string[];
    documents: string[];
    sensorData?: any;
  };
}

export interface UserLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  badgeIcon: string;
  color: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'conservation' | 'quality' | 'community' | 'education' | 'milestone';
  requirements: {
    type: string;
    value: number;
    timeframe?: string;
  };
  rewardPoints: number;
  tokenReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  level: UserLevel;
  weeklyPoints: number;
  monthlyPoints: number;
  totalWaterSaved: number;
  achievements: Achievement[];
  rank: number;
}

export interface RewardMultiplier {
  type: 'streak' | 'community' | 'quality' | 'volume' | 'special_event';
  multiplier: number;
  description: string;
  duration?: number; // in days
  conditions: any;
}

export class ConservationRewardsService {
  private htsService: HTSService;
  private waterManagementService: WaterManagementService;

  // User levels configuration
  private readonly USER_LEVELS: UserLevel[] = [
    {
      level: 1,
      title: 'Water Droplet',
      minPoints: 0,
      maxPoints: 999,
      benefits: ['Basic rewards', 'Community access'],
      badgeIcon: '💧',
      color: '#3B82F6'
    },
    {
      level: 2,
      title: 'Stream Guardian',
      minPoints: 1000,
      maxPoints: 4999,
      benefits: ['1.2x reward multiplier', 'Priority support'],
      badgeIcon: '🌊',
      color: '#06B6D4'
    },
    {
      level: 3,
      title: 'River Keeper',
      minPoints: 5000,
      maxPoints: 14999,
      benefits: ['1.5x reward multiplier', 'Exclusive events'],
      badgeIcon: '🏞️',
      color: '#10B981'
    },
    {
      level: 4,
      title: 'Lake Protector',
      minPoints: 15000,
      maxPoints: 39999,
      benefits: ['2x reward multiplier', 'Governance voting'],
      badgeIcon: '🏔️',
      color: '#8B5CF6'
    },
    {
      level: 5,
      title: 'Ocean Champion',
      minPoints: 40000,
      maxPoints: Infinity,
      benefits: ['3x reward multiplier', 'Leadership council'],
      badgeIcon: '🌊',
      color: '#F59E0B'
    }
  ];

  // Achievements configuration
  private readonly ACHIEVEMENTS: Achievement[] = [
    {
      id: 'first_save',
      name: 'First Drop',
      description: 'Record your first water conservation activity',
      icon: '🎯',
      category: 'milestone',
      requirements: { type: 'activities_count', value: 1 },
      rewardPoints: 100,
      tokenReward: 10,
      rarity: 'common'
    },
    {
      id: 'water_saver_100',
      name: 'Century Saver',
      description: 'Save 100 liters of water',
      icon: '💯',
      category: 'conservation',
      requirements: { type: 'water_saved', value: 100 },
      rewardPoints: 500,
      tokenReward: 50,
      rarity: 'common'
    },
    {
      id: 'water_saver_1000',
      name: 'Thousand Drops',
      description: 'Save 1,000 liters of water',
      icon: '🏆',
      category: 'conservation',
      requirements: { type: 'water_saved', value: 1000 },
      rewardPoints: 2000,
      tokenReward: 200,
      rarity: 'rare'
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Log conservation activities for 7 consecutive days',
      icon: '🔥',
      category: 'milestone',
      requirements: { type: 'streak_days', value: 7 },
      rewardPoints: 1000,
      tokenReward: 100,
      rarity: 'rare'
    },
    {
      id: 'quality_hero',
      name: 'Quality Hero',
      description: 'Improve water quality by 50% in a single action',
      icon: '⭐',
      category: 'quality',
      requirements: { type: 'quality_improvement', value: 50 },
      rewardPoints: 1500,
      tokenReward: 150,
      rarity: 'epic'
    },
    {
      id: 'community_leader',
      name: 'Community Leader',
      description: 'Help 10 community members with water conservation',
      icon: '👥',
      category: 'community',
      requirements: { type: 'community_helps', value: 10 },
      rewardPoints: 3000,
      tokenReward: 300,
      rarity: 'epic'
    },
    {
      id: 'ocean_protector',
      name: 'Ocean Protector',
      description: 'Save 10,000 liters of water',
      icon: '🌊',
      category: 'conservation',
      requirements: { type: 'water_saved', value: 10000 },
      rewardPoints: 10000,
      tokenReward: 1000,
      rarity: 'legendary'
    }
  ];

  constructor() {
    this.htsService = new HTSService();
    this.waterManagementService = new WaterManagementService();
  }

  // Record conservation activity
  async recordActivity(activity: Omit<ConservationActivity, 'id' | 'timestamp' | 'rewardPoints' | 'tokenReward'>): Promise<ConservationActivity> {
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate base reward points
    const basePoints = this.calculateBaseRewardPoints(activity);
    
    // Apply multipliers
    const multipliers = await this.getActiveMultipliers(activity.userId);
    const totalMultiplier = multipliers.reduce((acc, m) => acc * m.multiplier, 1);
    
    const rewardPoints = Math.floor(basePoints * totalMultiplier);
    const tokenReward = Math.floor(rewardPoints / 10); // 1 token per 10 points

    const fullActivity: ConservationActivity = {
      ...activity,
      id: activityId,
      timestamp: new Date(),
      rewardPoints,
      tokenReward
    };

    // Store activity (in real implementation, this would go to database)
    await this.storeActivity(fullActivity);

    // Check for achievements
    await this.checkAchievements(activity.userId, fullActivity);

    // Distribute token rewards
    if (tokenReward > 0 && activity.verified) {
      await this.distributeTokenReward(activity.userId, tokenReward, `Conservation activity: ${activity.description}`);
    }

    return fullActivity;
  }

  // Calculate base reward points based on activity type and impact
  private calculateBaseRewardPoints(activity: Partial<ConservationActivity>): number {
    let basePoints = 0;

    switch (activity.activityType) {
      case 'water_saving':
        basePoints = Math.min(activity.waterSaved || 0, 1000); // 1 point per liter, max 1000
        break;
      case 'quality_improvement':
        basePoints = (activity.qualityImprovement || 0) * 20; // 20 points per % improvement
        break;
      case 'leak_detection':
        basePoints = 500; // Fixed reward for leak detection
        break;
      case 'education':
        basePoints = 200; // Fixed reward for education activities
        break;
      case 'community_action':
        basePoints = 300; // Fixed reward for community actions
        break;
      default:
        basePoints = 100;
    }

    return Math.max(basePoints, 10); // Minimum 10 points
  }

  // Get active multipliers for a user
  private async getActiveMultipliers(userId: string): Promise<RewardMultiplier[]> {
    const multipliers: RewardMultiplier[] = [];

    // Level-based multiplier
    const userLevel = await this.getUserLevel(userId);
    if (userLevel.level > 1) {
      const levelMultiplier = 1 + (userLevel.level - 1) * 0.2;
      multipliers.push({
        type: 'streak',
        multiplier: levelMultiplier,
        description: `Level ${userLevel.level} bonus`,
        conditions: { level: userLevel.level }
      });
    }

    // Streak multiplier
    const streakDays = await this.getUserStreak(userId);
    if (streakDays >= 3) {
      const streakMultiplier = 1 + Math.min(streakDays * 0.1, 1); // Max 2x multiplier
      multipliers.push({
        type: 'streak',
        multiplier: streakMultiplier,
        description: `${streakDays}-day streak bonus`,
        conditions: { streakDays }
      });
    }

    // Community multiplier (if user is helping others)
    const communityScore = await this.getCommunityScore(userId);
    if (communityScore > 5) {
      multipliers.push({
        type: 'community',
        multiplier: 1.3,
        description: 'Community helper bonus',
        conditions: { communityScore }
      });
    }

    return multipliers;
  }

  // Get user's current level
  async getUserLevel(userId: string): Promise<UserLevel> {
    const totalPoints = await this.getUserTotalPoints(userId);
    
    for (let i = this.USER_LEVELS.length - 1; i >= 0; i--) {
      const level = this.USER_LEVELS[i];
      if (totalPoints >= level.minPoints) {
        return level;
      }
    }
    
    return this.USER_LEVELS[0]; // Default to level 1
  }

  // Get user's total points
  async getUserTotalPoints(userId: string): Promise<number> {
    // In real implementation, this would query the database
    // For now, return a mock value
    return 2500;
  }

  // Get user's current streak
  async getUserStreak(userId: string): Promise<number> {
    // In real implementation, this would calculate consecutive days
    return 5;
  }

  // Get user's community score
  async getCommunityScore(userId: string): Promise<number> {
    // In real implementation, this would calculate community contributions
    return 8;
  }

  // Check and award achievements
  async checkAchievements(userId: string, activity: ConservationActivity): Promise<Achievement[]> {
    const userStats = await this.getUserStats(userId);
    const newAchievements: Achievement[] = [];

    for (const achievement of this.ACHIEVEMENTS) {
      const hasAchievement = await this.userHasAchievement(userId, achievement.id);
      if (hasAchievement) continue;

      let qualifies = false;

      switch (achievement.requirements.type) {
        case 'activities_count':
          qualifies = userStats.totalActivities >= achievement.requirements.value;
          break;
        case 'water_saved':
          qualifies = userStats.totalWaterSaved >= achievement.requirements.value;
          break;
        case 'streak_days':
          qualifies = userStats.currentStreak >= achievement.requirements.value;
          break;
        case 'quality_improvement':
          qualifies = (activity.qualityImprovement || 0) >= achievement.requirements.value;
          break;
        case 'community_helps':
          qualifies = userStats.communityHelps >= achievement.requirements.value;
          break;
      }

      if (qualifies) {
        await this.awardAchievement(userId, achievement);
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    totalActivities: number;
    totalWaterSaved: number;
    currentStreak: number;
    communityHelps: number;
    totalPoints: number;
  }> {
    // In real implementation, this would query the database
    return {
      totalActivities: 15,
      totalWaterSaved: 2500,
      currentStreak: 5,
      communityHelps: 3,
      totalPoints: 2500
    };
  }

  // Check if user has achievement
  async userHasAchievement(userId: string, achievementId: string): Promise<boolean> {
    // In real implementation, this would query the database
    return false;
  }

  // Award achievement to user
  async awardAchievement(userId: string, achievement: Achievement): Promise<void> {
    // Store achievement in database
    await this.storeUserAchievement(userId, achievement);

    // Award token reward
    if (achievement.tokenReward > 0) {
      await this.distributeTokenReward(
        userId, 
        achievement.tokenReward, 
        `Achievement unlocked: ${achievement.name}`
      );
    }
  }

  // Get leaderboard
  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'all_time' = 'all_time', limit: number = 50): Promise<LeaderboardEntry[]> {
    // In real implementation, this would query the database
    const mockEntries: LeaderboardEntry[] = [
      {
        userId: 'user1',
        username: 'WaterHero',
        totalPoints: 15000,
        level: this.USER_LEVELS[3],
        weeklyPoints: 1200,
        monthlyPoints: 4500,
        totalWaterSaved: 8500,
        achievements: this.ACHIEVEMENTS.slice(0, 5),
        rank: 1
      },
      {
        userId: 'user2',
        username: 'AquaGuardian',
        totalPoints: 12000,
        level: this.USER_LEVELS[2],
        weeklyPoints: 800,
        monthlyPoints: 3200,
        totalWaterSaved: 6200,
        achievements: this.ACHIEVEMENTS.slice(0, 4),
        rank: 2
      }
    ];

    return mockEntries.slice(0, limit);
  }

  // Distribute token reward
  private async distributeTokenReward(userId: string, amount: number, reason: string): Promise<void> {
    try {
      const rewardTokenId = process.env.NEXT_PUBLIC_REWARD_TOKEN_ID;
      if (!rewardTokenId) {
        console.warn('Reward token ID not configured');
        return;
      }

      await this.htsService.transferToken({
        tokenId: rewardTokenId,
        from: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID || '',
        to: userId,
        amount: amount.toString(),
        memo: reason
      });
    } catch (error) {
      console.error('Failed to distribute token reward:', error);
    }
  }

  // Store activity (mock implementation)
  private async storeActivity(activity: ConservationActivity): Promise<void> {
    // In real implementation, this would store in database
    console.log('Storing activity:', activity);
  }

  // Store user achievement (mock implementation)
  private async storeUserAchievement(userId: string, achievement: Achievement): Promise<void> {
    // In real implementation, this would store in database
    console.log('Awarding achievement:', { userId, achievement });
  }

  // Get all achievements
  getAvailableAchievements(): Achievement[] {
    return [...this.ACHIEVEMENTS];
  }

  // Get user levels
  getUserLevels(): UserLevel[] {
    return [...this.USER_LEVELS];
  }

  // Calculate next level progress
  async getNextLevelProgress(userId: string): Promise<{
    currentLevel: UserLevel;
    nextLevel: UserLevel | null;
    progress: number;
    pointsToNext: number;
  }> {
    const totalPoints = await this.getUserTotalPoints(userId);
    const currentLevel = await this.getUserLevel(userId);
    
    const nextLevelIndex = this.USER_LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
    const nextLevel = nextLevelIndex < this.USER_LEVELS.length ? this.USER_LEVELS[nextLevelIndex] : null;
    
    if (!nextLevel) {
      return {
        currentLevel,
        nextLevel: null,
        progress: 100,
        pointsToNext: 0
      };
    }

    const pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
    const pointsNeededForNext = nextLevel.minPoints - currentLevel.minPoints;
    const progress = (pointsInCurrentLevel / pointsNeededForNext) * 100;
    const pointsToNext = nextLevel.minPoints - totalPoints;

    return {
      currentLevel,
      nextLevel,
      progress: Math.min(progress, 100),
      pointsToNext: Math.max(pointsToNext, 0)
    };
  }
}