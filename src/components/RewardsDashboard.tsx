'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Users, 
  Droplets,
  Star,
  Target,
  Calendar,
  MapPin,
  Camera,
  FileText,
  Zap,
  Crown,
  Medal,
  Gift
} from 'lucide-react';
import {
  useConservationRewards,
  useUserLevel,
  useUserProgress,
  useAchievements,
  useUserAchievements,
  useLeaderboard,
  useUserStats
} from '@/lib/hooks/useConservationRewards';
import { ConservationActivity } from '@/lib/rewards/conservation-rewards';

export default function RewardsDashboard() {
  const userId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID || 'demo_user';
  
  const conservationRewards = useConservationRewards();
  const { userLevel } = useUserLevel(userId);
  const { progress } = useUserProgress(userId);
  const { achievements } = useAchievements();
  const { userAchievements } = useUserAchievements(userId);
  const { leaderboard } = useLeaderboard('all_time', 10);
  const { stats } = useUserStats(userId);

  // Level configuration map used in the Levels tab
  type LevelInfo = { title: string; icon: string; color: string; minPoints: number };
  const LEVEL_CONFIG: Record<number, LevelInfo> = {
    1: { title: 'Water Droplet', icon: '💧', color: '#3B82F6', minPoints: 0 },
    2: { title: 'Stream Guardian', icon: '🌊', color: '#06B6D4', minPoints: 1000 },
    3: { title: 'River Keeper', icon: '🏞️', color: '#10B981', minPoints: 5000 },
    4: { title: 'Lake Protector', icon: '🏔️', color: '#8B5CF6', minPoints: 15000 },
    5: { title: 'Ocean Champion', icon: '🌊', color: '#F59E0B', minPoints: 40000 }
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [activityForm, setActivityForm] = useState({
    activityType: 'water_saving' as ConservationActivity['activityType'],
    description: '',
    waterSaved: '',
    qualityImprovement: '',
    location: {
      address: '',
      latitude: '',
      longitude: ''
    },
    verified: false
  });

  const handleRecordActivity = async () => {
    if (!activityForm.description) {
      return;
    }

    try {
      const activity = await conservationRewards.recordActivity({
        userId,
        activityType: activityForm.activityType,
        description: activityForm.description,
        waterSaved: parseFloat(activityForm.waterSaved) || 0,
        qualityImprovement: parseFloat(activityForm.qualityImprovement) || undefined,
        verified: activityForm.verified,
        location: activityForm.location.address ? {
          address: activityForm.location.address,
          latitude: parseFloat(activityForm.location.latitude) || 0,
          longitude: parseFloat(activityForm.location.longitude) || 0
        } : undefined
      });

      // Reset form
      setActivityForm({
        activityType: 'water_saving',
        description: '',
        waterSaved: '',
        qualityImprovement: '',
        location: { address: '', latitude: '', longitude: '' },
        verified: false
      });

      console.log('Activity recorded:', activity);
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'conservation': return <Droplets className="h-4 w-4" />;
      case 'quality': return <Star className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      case 'education': return <FileText className="h-4 w-4" />;
      case 'milestone': return <Target className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conservation Rewards</h1>
          <p className="text-muted-foreground">
            Earn rewards for water conservation activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium">Gamified Conservation</span>
        </div>
      </div>

      {conservationRewards.error && (
        <Alert variant="destructive">
          <AlertDescription>{conservationRewards.error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="record">Record Activity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="levels">Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* User Level and Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span>Your Level</span>
                </CardTitle>
                <CardDescription>Current conservation level and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userLevel && (
                  <div className="text-center space-y-2">
                    <div className="text-4xl">{userLevel.badgeIcon}</div>
                    <h3 className="text-xl font-bold" style={{ color: userLevel.color }}>
                      {userLevel.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">Level {userLevel.level}</p>
                  </div>
                )}

                {progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to next level</span>
                      <span>{Math.round(progress.progress)}%</span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    {progress.nextLevel && (
                      <p className="text-xs text-muted-foreground text-center">
                        {progress.pointsToNext} points to {progress.nextLevel.title}
                      </p>
                    )}
                  </div>
                )}

                {userLevel && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Level Benefits:</h4>
                    <ul className="text-sm space-y-1">
                      {userLevel.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Zap className="h-3 w-3 text-green-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Your Stats</span>
                </CardTitle>
                <CardDescription>Conservation impact summary</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalPoints}</div>
                      <div className="text-xs text-blue-800">Total Points</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.totalWaterSaved}L</div>
                      <div className="text-xs text-green-800">Water Saved</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
                      <div className="text-xs text-orange-800">Day Streak</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalActivities}</div>
                      <div className="text-xs text-purple-800">Activities</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Medal className="h-5 w-5 text-yellow-500" />
                <span>Recent Achievements</span>
              </CardTitle>
              <CardDescription>Your latest unlocked achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userAchievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="p-4 border rounded-lg text-center space-y-2">
                    <div className="text-3xl">{achievement.icon}</div>
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    <Badge className={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="record" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Conservation Activity</CardTitle>
              <CardDescription>
                Log your water conservation activities to earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activityType">Activity Type</Label>
                  <select
                    id="activityType"
                    value={activityForm.activityType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      setActivityForm(prev => ({ ...prev, activityType: e.target.value as ConservationActivity['activityType'] }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="water_saving">Water Saving</option>
                    <option value="quality_improvement">Quality Improvement</option>
                    <option value="leak_detection">Leak Detection</option>
                    <option value="education">Education</option>
                    <option value="community_action">Community Action</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="waterSaved">Water Saved (Liters)</Label>
                  <Input
                    id="waterSaved"
                    type="number"
                    value={activityForm.waterSaved}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setActivityForm(prev => ({ ...prev, waterSaved: e.target.value }))
                    }
                    placeholder="100"
                  />
                </div>
              </div>

              {activityForm.activityType === 'quality_improvement' && (
                <div>
                  <Label htmlFor="qualityImprovement">Quality Improvement (%)</Label>
                  <Input
                    id="qualityImprovement"
                    type="number"
                    value={activityForm.qualityImprovement}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setActivityForm(prev => ({ ...prev, qualityImprovement: e.target.value }))
                    }
                    placeholder="25"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={activityForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setActivityForm(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe your conservation activity..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="address">Location (Optional)</Label>
                  <Input
                    id="address"
                    value={activityForm.location.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setActivityForm(prev => ({ 
                        ...prev, 
                        location: { ...prev.location, address: e.target.value }
                      }))
                    }
                    placeholder="Address or description"
                  />
                </div>
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={activityForm.location.latitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setActivityForm(prev => ({ 
                        ...prev, 
                        location: { ...prev.location, latitude: e.target.value }
                      }))
                    }
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={activityForm.location.longitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setActivityForm(prev => ({ 
                        ...prev, 
                        location: { ...prev.location, longitude: e.target.value }
                      }))
                    }
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={activityForm.verified}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setActivityForm(prev => ({ ...prev, verified: e.target.checked }))
                  }
                />
                <Label htmlFor="verified">Mark as verified (with evidence)</Label>
              </div>

              <Button 
                onClick={handleRecordActivity}
                disabled={conservationRewards.loading || !activityForm.description}
                className="w-full"
              >
                <Gift className="h-4 w-4 mr-2" />
                Record Activity & Earn Rewards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Achievements</CardTitle>
              <CardDescription>
                Complete activities to unlock these achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const isUnlocked = userAchievements.some(ua => ua.id === achievement.id);
                  
                  return (
                    <div 
                      key={achievement.id} 
                      className={`p-4 border rounded-lg space-y-3 ${
                        isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-2xl">{achievement.icon}</div>
                        {isUnlocked && <Badge className="bg-green-100 text-green-800">Unlocked</Badge>}
                      </div>
                      
                      <div>
                        <h4 className="font-medium flex items-center space-x-2">
                          {getCategoryIcon(achievement.category)}
                          <span>{achievement.name}</span>
                        </h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {achievement.rewardPoints} pts + {achievement.tokenReward} tokens
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conservation Leaderboard</CardTitle>
              <CardDescription>
                Top water conservation champions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div key={entry.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {entry.rank}
                      </div>
                      <div>
                        <h4 className="font-medium">{entry.username}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{entry.level.badgeIcon}</span>
                          <span>{entry.level.title}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold">{entry.totalPoints.toLocaleString()} pts</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.totalWaterSaved.toLocaleString()}L saved
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Level System</CardTitle>
              <CardDescription>
                Progress through levels to unlock better rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((level) => {
                  const levelInfo = LEVEL_CONFIG[level] || { title: '', icon: '', color: '', minPoints: 0 };

                  const isCurrentLevel = userLevel?.level === level;
                  const isUnlocked = (userLevel?.level || 0) >= level;

                  return (
                    <div 
                      key={level}
                      className={`p-4 border rounded-lg ${
                        isCurrentLevel ? 'border-primary bg-primary/5' : 
                        isUnlocked ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{levelInfo.icon}</div>
                          <div>
                            <h4 className="font-bold" style={{ color: levelInfo.color }}>
                              Level {level}: {levelInfo.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {levelInfo.minPoints.toLocaleString()}+ points required
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isCurrentLevel && <Badge>Current</Badge>}
                          {isUnlocked && !isCurrentLevel && <Badge variant="outline">Unlocked</Badge>}
                          {!isUnlocked && <Badge variant="secondary">Locked</Badge>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}