"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Droplets, Coins, TrendingUp, Users } from 'lucide-react';
import { WalletBalanceDisplay } from '@/components/ui/WalletBalanceDisplay';

interface Well {
  id: string;
  code: string;
  name: string;
  location: string;
  tokenId?: string;
  operator: {
    name: string;
    accountId: string;
  };
  createdAt: string;
}

interface Settlement {
  id: string;
  wellId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  waterAmount: number;
  pricePerLiter: number;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  transactionId: string;
  createdAt: string;
  well: Well;
}

interface Token {
  id: string;
  tokenId: string;
  name: string;
  symbol: string;
  wellId: string;
  createdAt: string;
}

interface DashboardStats {
  totalWells: number;
  activeWells: number;
  totalRevenue: number;
  totalPayouts: number;
  recentEvents: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalWells: 0,
    activeWells: 0,
    totalRevenue: 0,
    totalPayouts: 0,
    recentEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waternity Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor wells, transactions, and water tokenization</p>
        </div>
        <Button onClick={fetchData} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wells</CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWells}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWells} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">from completed settlements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">to investors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Coins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentEvents.length}</div>
            <p className="text-xs text-muted-foreground">events in the last 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Balance Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WalletBalanceDisplay className="lg:col-span-1" />
        <div className="lg:col-span-2">
          {/* Placeholder for additional dashboard widgets */}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wells">Wells</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Live feed of on-chain activities from the Hedera Consensus Service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : stats.recentEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent events.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{event.title || 'Event'}</h3>
                            <Badge variant="outline">{event.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{event.description || 'No details available'}</p>
                          <div className="text-xs text-gray-500">
                            Well: {event.wellCode || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wells">
          {/* Placeholder for wells content */}
          <Card>
            <CardHeader>
              <CardTitle>Wells Management</CardTitle>
              <CardDescription>
                Well details will be loaded here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Well data loading soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settlements">
          {/* Placeholder for settlements content */}
          <Card>
            <CardHeader>
              <CardTitle>Settlements History</CardTitle>
              <CardDescription>
                Settlement details will be loaded here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Settlement data loading soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}