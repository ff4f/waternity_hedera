'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/SimpleSelect';

const SmartContractDashboard: React.FC = () => {
  const [selectedWellId, setSelectedWellId] = useState<string>('1');
  const [selectedUserId, setSelectedUserId] = useState<string>('user1');

  // Mock data for demonstration
  const mockWellInfo = {
    location: 'Jakarta Selatan',
    capacity: 10000,
    qualityScore: 85,
    isActive: true
  };

  const mockAllocation = {
    allocated: 500,
    used: 200,
    remaining: 300,
    lastUpdated: Date.now() / 1000
  };

  const mockStats = {
    totalWells: 15,
    totalUsers: 120,
    totalAllocated: 50000,
    totalConserved: 5000
  };

  const mockQualityHistory = [
    { timestamp: Date.now() / 1000, ph: 7.2, tds: 150, turbidity: 2.1 },
    { timestamp: (Date.now() / 1000) - 86400, ph: 7.1, tds: 148, turbidity: 2.3 },
    { timestamp: (Date.now() / 1000) - 172800, ph: 7.3, tds: 152, turbidity: 1.9 }
  ];

  // Form states
  const [newWellData, setNewWellData] = useState({
    location: '',
    capacity: '',
    quality: ''
  });

  const [allocationData, setAllocationData] = useState({
    userId: '',
    amount: ''
  });

  const [qualityData, setQualityData] = useState({
    wellId: '',
    ph: '',
    tds: '',
    turbidity: ''
  });

  const handleRegisterWell = async () => {
    console.log('Registering well:', newWellData);
    alert('Well registered successfully! (Mock mode)');
    setNewWellData({ location: '', capacity: '', quality: '' });
  };

  const handleAllocateWater = async () => {
    console.log('Allocating water:', allocationData);
    alert('Water allocated successfully! (Mock mode)');
    setAllocationData({ userId: '', amount: '' });
  };

  const handleSubmitQuality = async () => {
    console.log('Submitting quality data:', qualityData);
    alert('Quality data submitted successfully! (Mock mode)');
    setQualityData({ wellId: '', ph: '', tds: '', turbidity: '' });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Waternity Smart Contract Dashboard</h1>
        <p className="text-gray-600">Manage water resources on Hedera Hashgraph (Mock Mode)</p>
      </div>

      {/* Contract Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Statistics</CardTitle>
          <CardDescription>Overall system metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{mockStats.totalWells}</p>
              <p className="text-sm text-gray-600">Total Wells</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{mockStats.totalUsers}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{mockStats.totalAllocated}</p>
              <p className="text-sm text-gray-600">Total Allocated (L)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{mockStats.totalConserved}</p>
              <p className="text-sm text-gray-600">Total Conserved (L)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Well Information */}
        <Card>
          <CardHeader>
            <CardTitle>Well Information</CardTitle>
            <CardDescription>View well details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Well ID</label>
              <SimpleSelect
                value={selectedWellId}
                onValueChange={setSelectedWellId}
                options={[
                  { value: '1', label: 'Well 1' },
                  { value: '2', label: 'Well 2' },
                  { value: '3', label: 'Well 3' }
                ]}
              />
            </div>
            <div className="space-y-2">
              <p><strong>Location:</strong> {mockWellInfo.location}</p>
              <p><strong>Capacity:</strong> {mockWellInfo.capacity} L</p>
              <p><strong>Quality Score:</strong> {mockWellInfo.qualityScore}/100</p>
              <p><strong>Status:</strong> {mockWellInfo.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Water Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Water Allocation</CardTitle>
            <CardDescription>View user water allocation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <SimpleSelect
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                options={[
                  { value: 'user1', label: 'User 1' },
                  { value: 'user2', label: 'User 2' },
                  { value: 'user3', label: 'User 3' }
                ]}
              />
            </div>
            <div className="space-y-2">
              <p><strong>Allocated:</strong> {mockAllocation.allocated} L</p>
              <p><strong>Used:</strong> {mockAllocation.used} L</p>
              <p><strong>Remaining:</strong> {mockAllocation.remaining} L</p>
              <p><strong>Last Updated:</strong> {new Date(mockAllocation.lastUpdated * 1000).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Write Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Register Well */}
        <Card>
          <CardHeader>
            <CardTitle>Register New Well</CardTitle>
            <CardDescription>Add a new water well to the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                value={newWellData.location}
                onChange={(e) => setNewWellData({ ...newWellData, location: e.target.value })}
                placeholder="Enter well location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Capacity (L)</label>
              <Input
                type="number"
                value={newWellData.capacity}
                onChange={(e) => setNewWellData({ ...newWellData, capacity: e.target.value })}
                placeholder="Enter capacity in liters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quality Score (0-100)</label>
              <Input
                type="number"
                value={newWellData.quality}
                onChange={(e) => setNewWellData({ ...newWellData, quality: e.target.value })}
                placeholder="Enter quality score"
                min="0"
                max="100"
              />
            </div>
            <Button 
              onClick={handleRegisterWell}
              disabled={!newWellData.location || !newWellData.capacity || !newWellData.quality}
              className="w-full"
            >
              Register Well
            </Button>
          </CardContent>
        </Card>

        {/* Allocate Water */}
        <Card>
          <CardHeader>
            <CardTitle>Allocate Water</CardTitle>
            <CardDescription>Allocate water to a user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <Input
                value={allocationData.userId}
                onChange={(e) => setAllocationData({ ...allocationData, userId: e.target.value })}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount (L)</label>
              <Input
                type="number"
                value={allocationData.amount}
                onChange={(e) => setAllocationData({ ...allocationData, amount: e.target.value })}
                placeholder="Enter amount in liters"
              />
            </div>
            <Button 
              onClick={handleAllocateWater}
              disabled={!allocationData.userId || !allocationData.amount}
              className="w-full"
            >
              Allocate Water
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quality History */}
      <Card>
        <CardHeader>
          <CardTitle>Water Quality History</CardTitle>
          <CardDescription>Recent quality measurements for Well {selectedWellId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">pH</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">TDS</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Turbidity</th>
                </tr>
              </thead>
              <tbody>
                {mockQualityHistory.map((record, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(record.timestamp * 1000).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{record.ph}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.tds}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.turbidity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Submit Quality Data */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Quality Data</CardTitle>
          <CardDescription>Record new water quality measurements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Well ID</label>
              <Input
                value={qualityData.wellId}
                onChange={(e) => setQualityData({ ...qualityData, wellId: e.target.value })}
                placeholder="Well ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">pH</label>
              <Input
                type="number"
                step="0.1"
                value={qualityData.ph}
                onChange={(e) => setQualityData({ ...qualityData, ph: e.target.value })}
                placeholder="pH level"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">TDS</label>
              <Input
                type="number"
                value={qualityData.tds}
                onChange={(e) => setQualityData({ ...qualityData, tds: e.target.value })}
                placeholder="TDS (ppm)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Turbidity</label>
              <Input
                type="number"
                step="0.1"
                value={qualityData.turbidity}
                onChange={(e) => setQualityData({ ...qualityData, turbidity: e.target.value })}
                placeholder="Turbidity (NTU)"
              />
            </div>
          </div>
          <Button 
            onClick={handleSubmitQuality}
            disabled={!qualityData.wellId || !qualityData.ph || !qualityData.tds || !qualityData.turbidity}
            className="w-full"
          >
            Submit Quality Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartContractDashboard;