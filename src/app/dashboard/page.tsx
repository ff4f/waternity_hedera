"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Droplets, Coins, TrendingUp, Users } from 'lucide-react';

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
  totalSettlements: number;
  totalWaterTraded: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [wells, setWells] = useState<Well[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalWells: 0,
    totalSettlements: 0,
    totalWaterTraded: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch wells
      const wellsResponse = await fetch('/api/wells');
      const wellsData = await wellsResponse.json();
      setWells(wellsData.wells || []);

      // Fetch settlements
      const settlementsResponse = await fetch('/api/settlements');
      const settlementsData = await settlementsResponse.json();
      setSettlements(settlementsData.settlements || []);

      // Calculate stats
      const totalWaterTraded = settlementsData.settlements?.reduce(
        (sum: number, settlement: Settlement) => sum + settlement.waterAmount, 0
      ) || 0;
      
      const totalRevenue = settlementsData.settlements?.reduce(
        (sum: number, settlement: Settlement) => sum + settlement.totalPrice, 0
      ) || 0;

      setStats({
        totalWells: wellsData.wells?.length || 0,
        totalSettlements: settlementsData.settlements?.length || 0,
        totalWaterTraded,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
            <p className="text-xs text-muted-foreground">Active water sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settlements</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSettlements}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Traded</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWaterTraded.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Liters traded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Coins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">HBAR/Tokens</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="wells" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wells">Wells</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>

        <TabsContent value="wells" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Water Wells</CardTitle>
              <CardDescription>Manage and monitor water sources</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : wells.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No wells found. Create your first well to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {wells.map((well) => (
                    <div key={well.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{well.name}</h3>
                            <Badge variant="outline">{well.code}</Badge>
                            {well.tokenId && (
                              <Badge className="bg-blue-100 text-blue-800">
                                Token: {well.tokenId}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{well.location}</p>
                          <div className="text-xs text-gray-500">
                            Operator: {well.operator.name} ({well.operator.accountId})
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          Created: {formatDate(well.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Water Settlements</CardTitle>
              <CardDescription>Track water trading transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : settlements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No settlements found. Start trading water to see transactions here.
                </div>
              ) : (
                <div className="space-y-4">
                  {settlements.map((settlement) => (
                    <div key={settlement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{settlement.well.name}</h3>
                            <Badge className={getStatusColor(settlement.status)}>
                              {settlement.status}
                            </Badge>
                            <Badge variant="outline">
                              {settlement.paymentMethod}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Water Amount:</span>
                              <span className="ml-2 font-medium">{settlement.waterAmount} L</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Price per Liter:</span>
                              <span className="ml-2 font-medium">{settlement.pricePerLiter}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Price:</span>
                              <span className="ml-2 font-medium">{settlement.totalPrice}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Transaction ID:</span>
                              <span className="ml-2 font-mono text-xs">{settlement.transactionId}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Buyer: {settlement.buyerAccountId} → Seller: {settlement.sellerAccountId}
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {formatDate(settlement.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}