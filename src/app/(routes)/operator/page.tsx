import { Metadata } from 'next'
import Link from 'next/link'
import MeterForm from '@/components/forms/MeterForm'
import ValveForm from '@/components/forms/ValveForm'

export const metadata: Metadata = {
  title: 'Operator Panel - Waternity',
  description: 'Well operations management and monitoring dashboard',
}

// Mock data for operator dashboard
const mockOperatorData = {
  operatorId: 'op-001',
  operatorName: 'John Operator',
  totalWells: 3,
  activeWells: 2,
  maintenanceWells: 1,
  totalProduction: 15750.5, // kWh
  monthlyRevenue: 8950.75,
  operationalCosts: 2100.25,
  wells: [
    {
      id: '1',
      code: 'WTR-001',
      name: 'Sunrise Valley Well',
      location: 'Lagos, Nigeria',
      status: 'ACTIVE',
      depth: 150,
      capacity: 5000,
      currentProduction: 4750.5,
      efficiency: 95.0,
      lastMaintenance: new Date('2023-12-15'),
      nextMaintenance: new Date('2024-03-15'),
      topicId: '0.0.12345',
      tokenId: '0.0.67890',
      alerts: 0,
      investors: 8
    },
    {
      id: '2',
      code: 'WTR-002',
      name: 'Green Hills Water Source',
      location: 'Abuja, Nigeria',
      status: 'ACTIVE',
      depth: 200,
      capacity: 7500,
      currentProduction: 7200.0,
      efficiency: 96.0,
      lastMaintenance: new Date('2024-01-10'),
      nextMaintenance: new Date('2024-04-10'),
      topicId: '0.0.23456',
      tokenId: '0.0.78901',
      alerts: 1,
      investors: 12
    },
    {
      id: '3',
      code: 'WTR-003',
      name: 'Desert Oasis Project',
      location: 'Kano, Nigeria',
      status: 'MAINTENANCE',
      depth: 180,
      capacity: 6000,
      currentProduction: 0,
      efficiency: 0,
      lastMaintenance: new Date('2024-01-20'),
      nextMaintenance: new Date('2024-01-25'),
      topicId: '0.0.34567',
      tokenId: '0.0.89012',
      alerts: 3,
      investors: 6
    }
  ],
  recentActivities: [
    {
      id: '1',
      type: 'MAINTENANCE_COMPLETED',
      wellCode: 'WTR-002',
      title: 'Routine Maintenance Completed',
      description: 'Quarterly maintenance and inspection completed successfully',
      timestamp: new Date('2024-01-20T14:30:00Z'),
      priority: 'normal'
    },
    {
      id: '2',
      type: 'PRODUCTION_MILESTONE',
      wellCode: 'WTR-001',
      title: 'Production Milestone Reached',
      description: 'Monthly production target of 4,500 kWh exceeded',
      timestamp: new Date('2024-01-19T10:15:00Z'),
      priority: 'high'
    },
    {
      id: '3',
      type: 'ALERT_RESOLVED',
      wellCode: 'WTR-002',
      title: 'Pressure Alert Resolved',
      description: 'Water pressure normalized after valve adjustment',
      timestamp: new Date('2024-01-18T16:45:00Z'),
      priority: 'normal'
    }
  ],
  upcomingTasks: [
    {
      id: '1',
      wellCode: 'WTR-003',
      task: 'Complete maintenance inspection',
      dueDate: new Date('2024-01-25'),
      priority: 'high',
      status: 'pending'
    },
    {
      id: '2',
      wellCode: 'WTR-001',
      task: 'Submit monthly production report',
      dueDate: new Date('2024-01-31'),
      priority: 'medium',
      status: 'pending'
    },
    {
      id: '3',
      wellCode: 'WTR-002',
      task: 'Schedule quarterly maintenance',
      dueDate: new Date('2024-02-05'),
      priority: 'low',
      status: 'pending'
    }
  ]
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

import { getStatusColor } from '@/lib/ui'

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 95) return 'text-green-600'
  if (efficiency >= 85) return 'text-yellow-600'
  return 'text-red-600'
}

export default function OperatorPage() {
  const totalAlerts = mockOperatorData.wells.reduce((sum, well) => sum + well.alerts, 0)
  const netProfit = mockOperatorData.monthlyRevenue - mockOperatorData.operationalCosts

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Operator Panel</h1>
            <p className="text-gray-600">
              Manage and monitor your water well operations on Hedera
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary">
              Generate Report
            </button>
            <button className="btn-primary">
              Submit Data
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      {totalAlerts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {totalAlerts} Active Alert{totalAlerts > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Some wells require immediate attention. Please review and address the issues.
              </p>
            </div>
            <div className="ml-auto">
              <button className="text-yellow-800 hover:text-yellow-900 text-sm font-medium">
                View All Alerts →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operations Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Wells</p>
              <p className="text-2xl font-semibold text-gray-900">{mockOperatorData.totalWells}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Production</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(mockOperatorData.totalProduction)} kWh</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(mockOperatorData.monthlyRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={netProfit >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className={`text-2xl font-semibold ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wells Management */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Wells Management</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {mockOperatorData.wells.map((well) => (
                <div key={well.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">{well.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(well.status)}`}>
                          {well.status}
                        </span>
                        {well.alerts > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {well.alerts} Alert{well.alerts > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{well.code} • {well.location}</p>
                    </div>
                    <Link 
                      href={`/well/${well.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Manage →
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Production</p>
                      <p className="font-medium text-gray-900">{formatNumber(well.currentProduction)} kWh</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Efficiency</p>
                      <p className={`font-medium ${getEfficiencyColor(well.efficiency)}`}>
                        {well.efficiency.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Capacity</p>
                      <p className="font-medium text-gray-900">{formatNumber(well.capacity)} kWh</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Investors</p>
                      <p className="font-medium text-gray-900">{well.investors}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Topic: {well.topicId}</span>
                      <span>Token: {well.tokenId}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Next maintenance: {formatDate(well.nextMaintenance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockOperatorData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                        {activity.wellCode}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockOperatorData.upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">{task.wellCode}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{task.task}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {formatDate(task.dueDate)}</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Complete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}