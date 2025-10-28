'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Droplet, Activity, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import SettlementStatusIndicator from '@/components/SettlementStatusIndicator';

interface Well {
  id: string;
  code: string;
  name: string;
  location: string;
  topicId: string;
  tokenId?: string;
  operator: {
    name: string;
    accountId?: string;
  };
  createdAt: string;
}

interface WaterQuality {
  id: string;
  wellId: string;
  ph: number;
  turbidity: number;
  tds: number;
  temperature: number;
  chlorine: number;
  bacteria: number;
  compliance: boolean;
  testedBy: string;
  certificationBody?: string;
  createdAt: string;
  well: Well;
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

interface DashboardStats {
  totalWells: number;
  activeWells: number;
  totalWaterQualityTests: number;
  complianceRate: number;
  totalSettlements: number;
  totalRevenue: number;
  averageWaterQuality: {
    ph: number;
    turbidity: number;
    tds: number;
    temperature: number;
  };
}

const RealTimeMonitoringDashboard: React.FC = () => {
  const [wells, setWells] = useState<Well[]>([]);
  const [waterQuality, setWaterQuality] = useState<WaterQuality[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalWells: 0,
    activeWells: 0,
    totalWaterQualityTests: 0,
    complianceRate: 0,
    totalSettlements: 0,
    totalRevenue: 0,
    averageWaterQuality: {
      ph: 0,
      turbidity: 0,
      tds: 0,
      temperature: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch wells
      const wellsResponse = await fetch('/api/wells?limit=50');
      const wellsData = await wellsResponse.json();
      setWells(wellsData.wells || []);

      // Fetch water quality data
      const waterQualityResponse = await fetch('/api/water-quality?limit=50');
      const waterQualityData = await waterQualityResponse.json();
      setWaterQuality(waterQualityData.waterQuality || []);

      // Fetch settlements
      const settlementsResponse = await fetch('/api/settlements?limit=50');
      const settlementsData = await settlementsResponse.json();
      setSettlements(settlementsData.settlements || []);

      // Calculate stats
      calculateStats(wellsData.wells || [], waterQualityData.waterQuality || [], settlementsData.settlements || []);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (wellsData: Well[], waterQualityData: WaterQuality[], settlementsData: Settlement[]) => {
    const totalWells = wellsData.length;
    const activeWells = wellsData.length; // Assuming all wells are active for now
    const totalWaterQualityTests = waterQualityData.length;
    const complianceRate = totalWaterQualityTests > 0 
      ? (waterQualityData.filter(wq => wq.compliance).length / totalWaterQualityTests) * 100 
      : 0;
    const totalSettlements = settlementsData.length;
    const totalRevenue = settlementsData.reduce((sum, settlement) => sum + settlement.totalPrice, 0);
    
    // Calculate average water quality metrics
    const avgPh = totalWaterQualityTests > 0 
      ? waterQualityData.reduce((sum, wq) => sum + wq.ph, 0) / totalWaterQualityTests 
      : 0;
    const avgTurbidity = totalWaterQualityTests > 0 
      ? waterQualityData.reduce((sum, wq) => sum + wq.turbidity, 0) / totalWaterQualityTests 
      : 0;
    const avgTds = totalWaterQualityTests > 0 
      ? waterQualityData.reduce((sum, wq) => sum + wq.tds, 0) / totalWaterQualityTests 
      : 0;
    const avgTemperature = totalWaterQualityTests > 0 
      ? waterQualityData.reduce((sum, wq) => sum + wq.temperature, 0) / totalWaterQualityTests 
      : 0;

    setStats({
      totalWells,
      activeWells,
      totalWaterQualityTests,
      complianceRate,
      totalSettlements,
      totalRevenue,
      averageWaterQuality: {
        ph: avgPh,
        turbidity: avgTurbidity,
        tds: avgTds,
        temperature: avgTemperature
      }
    });
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getWaterQualityStatus = (wq: WaterQuality) => {
    if (!wq.compliance) return { status: 'Non-Compliant', color: 'bg-red-100 text-red-800', icon: XCircle };
    if (wq.ph < 6.5 || wq.ph > 8.5) return { status: 'Warning', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { status: 'Excellent', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getSettlementStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wells</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWells}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWells} active wells
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Quality Tests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWaterQualityTests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.complianceRate.toFixed(1)}% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSettlements} settlements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Water Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">pH {stats.averageWaterQuality.ph.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageWaterQuality.temperature.toFixed(1)}°C avg temp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tabs */}
      <Tabs defaultValue="wells" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wells">Wells ({wells.length})</TabsTrigger>
          <TabsTrigger value="water-quality">Water Quality ({waterQuality.length})</TabsTrigger>
          <TabsTrigger value="settlements">Settlements ({settlements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="wells" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Water Wells</CardTitle>
              <CardDescription>Real-time monitoring of all water wells</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : wells.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No wells found.
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
                          <p className="text-xs text-gray-500">
                            Operator: {well.operator.name} | Topic: {well.topicId}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(well.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="water-quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Water Quality Monitoring</CardTitle>
              <CardDescription>Latest water quality test results</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : waterQuality.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No water quality data found.
                </div>
              ) : (
                <div className="space-y-4">
                  {waterQuality.map((wq) => {
                    const qualityStatus = getWaterQualityStatus(wq);
                    const StatusIcon = qualityStatus.icon;
                    
                    return (
                      <div key={wq.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{wq.well.name}</h3>
                              <Badge variant="outline">{wq.well.code}</Badge>
                              <Badge className={qualityStatus.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {qualityStatus.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">pH:</span>
                                <span className="ml-1 font-medium">{wq.ph}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Turbidity:</span>
                                <span className="ml-1 font-medium">{wq.turbidity} NTU</span>
                              </div>
                              <div>
                                <span className="text-gray-500">TDS:</span>
                                <span className="ml-1 font-medium">{wq.tds} ppm</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Temp:</span>
                                <span className="ml-1 font-medium">{wq.temperature}°C</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Tested by: {wq.testedBy} | {wq.certificationBody}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(wq.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Water Transactions</CardTitle>
              <CardDescription>Recent water trading settlements</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : settlements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No settlements found.
                </div>
              ) : (
                <div className="space-y-4">
                  {settlements.map((settlement) => (
                    <div key={settlement.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{settlement.well.name}</h3>
                            <Badge variant="outline">{settlement.well.code}</Badge>
                            <SettlementStatusIndicator status={settlement.status?.toUpperCase() as 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'EXECUTED' | 'FAILED' | 'REJECTED' | 'CANCELLED'} />
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <span className="ml-1 font-medium">{settlement.waterAmount}L</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <span className="ml-1 font-medium">${settlement.pricePerLiter}/L</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="ml-1 font-medium">${settlement.totalPrice}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Buyer: {settlement.buyerAccountId} | Seller: {settlement.sellerAccountId}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            TX: {settlement.transactionId}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{settlement.paymentMethod}</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(settlement.createdAt).toLocaleString()}
                          </p>
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
};

export default RealTimeMonitoringDashboard;