import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'User Dashboard - Waternity',
  description: 'User dashboard for water investment and monitoring',
}

// Mock data untuk user dashboard
const mockUserData = {
  userProfile: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'USER',
    hederaAccountId: '0.0.123456',
    joinedAt: new Date('2024-01-15T10:30:00Z'),
    totalInvestment: 25000,
    activeInvestments: 3,
    totalReturns: 2750
  },
  investments: [
    {
      id: '1',
      wellCode: 'WTR-001',
      wellName: 'Sunrise Valley Well',
      location: 'Lagos, Nigeria',
      investmentAmount: 15000,
      currentValue: 16500,
      monthlyReturn: 450,
      status: 'active',
      investedAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      id: '2',
      wellCode: 'WTR-003',
      wellName: 'Green Hills Well',
      location: 'Abuja, Nigeria',
      investmentAmount: 10000,
      currentValue: 10750,
      monthlyReturn: 300,
      status: 'active',
      investedAt: new Date('2024-01-20T14:20:00Z')
    }
  ],
  recentTransactions: [
    {
      id: '1',
      type: 'investment',
      amount: 15000,
      wellCode: 'WTR-001',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      txHash: '0x1234...abcd'
    },
    {
      id: '2',
      type: 'return',
      amount: 450,
      wellCode: 'WTR-001',
      timestamp: new Date('2024-01-22T09:15:00Z'),
      txHash: '0x5678...efgh'
    },
    {
      id: '3',
      type: 'investment',
      amount: 10000,
      wellCode: 'WTR-003',
      timestamp: new Date('2024-01-20T14:20:00Z'),
      txHash: '0x9abc...ijkl'
    }
  ],
  notifications: [
    {
      id: '1',
      type: 'return',
      title: 'Monthly Return Received',
      message: 'You received $450 return from Sunrise Valley Well',
      timestamp: new Date('2024-01-22T09:15:00Z'),
      read: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Well Maintenance Update',
      message: 'Desert Springs Well maintenance completed successfully',
      timestamp: new Date('2024-01-21T16:45:00Z'),
      read: true
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
    year: 'numeric',
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

function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'investment':
      return 'bg-blue-100 text-blue-800'
    case 'return':
      return 'bg-green-100 text-green-800'
    case 'withdrawal':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'return':
      return '💰'
    case 'info':
      return 'ℹ️'
    case 'warning':
      return '⚠️'
    case 'success':
      return '✅'
    default:
      return '📢'
  }
}

export default function UserPage() {
  const { userProfile, investments, recentTransactions, notifications } = mockUserData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
              <p className="text-gray-600">Welcome back, {userProfile.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Account ID</p>
                <p className="font-mono text-sm">{userProfile.hederaAccountId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(userProfile.totalInvestment)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(userProfile.totalReturns)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">🏗️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Investments</p>
                <p className="text-2xl font-bold text-gray-900">{userProfile.activeInvestments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ROI</p>
                <p className="text-2xl font-bold text-gray-900">{((userProfile.totalReturns / userProfile.totalInvestment) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Investments */}
          <div className="bg-white rounded-lg shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">My Investments</h2>
                <Link href="/marketplace" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Explore More
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {investments.map((investment) => (
                  <div key={investment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{investment.wellName}</h4>
                        <p className="text-sm text-gray-600 mb-2">{investment.location}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-500">{investment.wellCode}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(investment.status)}`}>
                            {investment.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Investment</p>
                        <p className="font-medium">{formatCurrency(investment.investmentAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Current Value</p>
                        <p className="font-medium text-green-600">{formatCurrency(investment.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Monthly Return</p>
                        <p className="font-medium">{formatCurrency(investment.monthlyReturn)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Invested</p>
                        <p className="font-medium">{formatDate(investment.investedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{transaction.wellCode}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Date: {formatDateTime(transaction.timestamp)}</p>
                      <p>TX: {transaction.txHash}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  View All Transactions →
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-card lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`border rounded-lg p-4 ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{notification.title}</h4>
                        <p className="text-sm mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(notification.timestamp)}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  View All Notifications →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}