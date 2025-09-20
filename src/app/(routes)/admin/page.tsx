import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Waternity',
  description: 'System administration and management interface',
}

// Mock data for admin dashboard
const mockAdminData = {
  systemStats: {
    totalUsers: 1247,
    totalWells: 89,
    totalTransactions: 15623,
    totalTokens: 2456789,
    activeAgents: 23,
    pendingVerifications: 45,
    systemUptime: '99.9%',
    networkStatus: 'healthy'
  },
  recentUsers: [
    {
      id: '1',
      name: 'John Investor',
      email: 'john@example.com',
      role: 'INVESTOR',
      status: 'active',
      joinedAt: new Date('2024-01-15T10:30:00Z'),
      lastActive: new Date('2024-01-22T14:20:00Z'),
      hederaAccountId: '0.0.12345'
    },
    {
      id: '2',
      name: 'Sarah Agent',
      email: 'sarah@example.com',
      role: 'AGENT',
      status: 'active',
      joinedAt: new Date('2024-01-10T09:15:00Z'),
      lastActive: new Date('2024-01-22T16:45:00Z'),
      hederaAccountId: '0.0.23456'
    },
    {
      id: '3',
      name: 'Mike Operator',
      email: 'mike@example.com',
      role: 'OPERATOR',
      status: 'pending',
      joinedAt: new Date('2024-01-20T11:00:00Z'),
      lastActive: new Date('2024-01-21T08:30:00Z'),
      hederaAccountId: '0.0.34567'
    }
  ],
  systemAlerts: [
    {
      id: '1',
      type: 'warning',
      title: 'High Verification Queue',
      message: 'Verification queue has 45 pending items, consider assigning more agents',
      timestamp: new Date('2024-01-22T15:30:00Z'),
      severity: 'medium'
    },
    {
      id: '2',
      type: 'info',
      title: 'Network Update',
      message: 'Hedera network maintenance scheduled for Jan 25, 2024 02:00 UTC',
      timestamp: new Date('2024-01-22T12:00:00Z'),
      severity: 'low'
    },
    {
      id: '3',
      type: 'success',
      title: 'Backup Completed',
      message: 'Daily database backup completed successfully',
      timestamp: new Date('2024-01-22T06:00:00Z'),
      severity: 'low'
    }
  ],
  networkMetrics: {
    hcsTopics: 89,
    htsTokens: 156,
    totalTransactions: 15623,
    avgTransactionFee: '0.0001 HBAR',
    consensusNodes: 3,
    mirrorNodeLatency: '45ms'
  },
  wellsOverview: [
    {
      id: '1',
      code: 'WTR-001',
      name: 'Sunrise Valley Well',
      location: 'Lagos, Nigeria',
      status: 'active',
      operator: 'John Operator',
      investors: 12,
      totalInvestment: 50000,
      monthlyProduction: 4750,
      lastUpdate: new Date('2024-01-22T10:30:00Z')
    },
    {
      id: '2',
      code: 'WTR-002',
      name: 'Desert Springs Well',
      location: 'Abuja, Nigeria',
      status: 'maintenance',
      operator: 'Mike Supervisor',
      investors: 8,
      totalInvestment: 35000,
      monthlyProduction: 3200,
      lastUpdate: new Date('2024-01-21T16:45:00Z')
    }
  ]
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800'
    case 'OPERATOR':
      return 'bg-blue-100 text-blue-800'
    case 'AGENT':
      return 'bg-green-100 text-green-800'
    case 'INVESTOR':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'status-executed'
    case 'pending':
      return 'status-pending'
    case 'inactive':
      return 'status-inactive'
    case 'maintenance':
      return 'status-failed'
    default:
      return 'status-inactive'
  }
}

function getAlertColor(type: string): string {
  switch (type) {
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

function getAlertIcon(type: string): string {
  switch (type) {
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    case 'success':
      return '✅'
    default:
      return '📋'
  }
}

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">
              System administration and management for Waternity platform
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary">
              System Logs
            </button>
            <button className="btn-secondary">
              Export Data
            </button>
            <button className="btn-primary">
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(mockAdminData.systemStats.totalUsers)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Wells</p>
              <p className="text-2xl font-semibold text-gray-900">{mockAdminData.systemStats.totalWells}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(mockAdminData.systemStats.totalTransactions)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Uptime</p>
              <p className="text-2xl font-semibold text-gray-900">{mockAdminData.systemStats.systemUptime}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockAdminData.systemAlerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{alert.title}</h4>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <p className="text-xs opacity-75">{formatDateTime(alert.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All Alerts →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
              <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Manage Users
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockAdminData.recentUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{user.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(user.status)}`}>
                          {user.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Joined: {formatDate(user.joinedAt)}</p>
                    <p>Last Active: {formatDateTime(user.lastActive)}</p>
                    <p>Account: {user.hederaAccountId}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All Users →
              </button>
            </div>
          </div>
        </div>

        {/* Network Metrics */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Hedera Network</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">HCS Topics</span>
                <span className="font-medium">{mockAdminData.networkMetrics.hcsTopics}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">HTS Tokens</span>
                <span className="font-medium">{mockAdminData.networkMetrics.htsTokens}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Transactions</span>
                <span className="font-medium">{formatNumber(mockAdminData.networkMetrics.totalTransactions)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Avg TX Fee</span>
                <span className="font-medium">{mockAdminData.networkMetrics.avgTransactionFee}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Consensus Nodes</span>
                <span className="font-medium">{mockAdminData.networkMetrics.consensusNodes}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Mirror Node Latency</span>
                <span className="font-medium text-green-600">{mockAdminData.networkMetrics.mirrorNodeLatency}</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button className="w-full btn-secondary text-sm">
                Network Status Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wells Management */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Wells Management</h2>
              <div className="flex space-x-3">
                <button className="btn-secondary text-sm">
                  Export Wells
                </button>
                <Link href="/admin/wells" className="btn-primary text-sm">
                  Manage Wells
                </Link>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Well</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockAdminData.wellsOverview.map((well) => (
                    <tr key={well.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{well.name}</div>
                          <div className="text-sm text-gray-500">{well.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {well.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(well.status)}`}>
                          {well.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {well.operator}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(well.totalInvestment)}</div>
                        <div className="text-sm text-gray-500">{well.investors} investors</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(well.monthlyProduction)} kWh/month
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(well.lastUpdate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All Wells →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Add User</span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Create Well</span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">View Reports</span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">System Config</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}