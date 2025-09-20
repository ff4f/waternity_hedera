import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard - Waternity',
  description: 'Main dashboard for Waternity water well management platform',
}

// Mock data for demonstration
const mockStats = {
  totalWells: 12,
  activeWells: 10,
  totalRevenue: 45678.90,
  totalPayouts: 32145.67,
  recentEvents: [
    {
      id: '1',
      type: 'WELL_CREATED',
      title: 'New Well Created',
      description: 'Well WTR-003 has been successfully created and registered on Hedera',
      timestamp: new Date('2024-01-20T10:30:00Z'),
      wellCode: 'WTR-003',
      txId: '0.0.12345@1705747800.123456789'
    },
    {
      id: '2',
      type: 'MILESTONE_VERIFIED',
      title: 'Milestone Verified',
      description: 'Production milestone for Well WTR-001 has been verified by agent',
      timestamp: new Date('2024-01-20T09:15:00Z'),
      wellCode: 'WTR-001',
      txId: '0.0.12345@1705743300.987654321'
    },
    {
      id: '3',
      type: 'PAYOUT_EXECUTED',
      title: 'Payout Executed',
      description: 'Monthly payout of 1,250 HBAR distributed to investors',
      timestamp: new Date('2024-01-20T08:45:00Z'),
      wellCode: 'WTR-002',
      txId: '0.0.12345@1705741500.456789123'
    }
  ]
}

const mockWells = [
  {
    id: '1',
    code: 'WTR-001',
    name: 'Sunrise Valley Well',
    location: 'Lagos, Nigeria',
    status: 'ACTIVE',
    operator: { name: 'John Operator', walletEvm: '0x1234...5678' },
    _count: { events: 24, documents: 8, settlements: 3 }
  },
  {
    id: '2',
    code: 'WTR-002',
    name: 'Green Hills Water Source',
    location: 'Abuja, Nigeria',
    status: 'ACTIVE',
    operator: { name: 'Sarah Manager', walletEvm: '0x9876...4321' },
    _count: { events: 18, documents: 6, settlements: 2 }
  },
  {
    id: '3',
    code: 'WTR-003',
    name: 'Desert Oasis Project',
    location: 'Kano, Nigeria',
    status: 'MAINTENANCE',
    operator: { name: 'Mike Supervisor', walletEvm: '0x5555...9999' },
    _count: { events: 12, documents: 4, settlements: 1 }
  }
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'status-active'
    case 'INACTIVE':
      return 'status-inactive'
    case 'MAINTENANCE':
      return 'status-maintenance'
    default:
      return 'status-inactive'
  }
}

function getEventTypeColor(type: string): string {
  switch (type) {
    case 'WELL_CREATED':
      return 'bg-blue-100 text-blue-800'
    case 'MILESTONE_VERIFIED':
      return 'bg-green-100 text-green-800'
    case 'PAYOUT_EXECUTED':
      return 'bg-purple-100 text-purple-800'
    case 'SETTLEMENT_REQUESTED':
      return 'bg-yellow-100 text-yellow-800'
    case 'TOKEN_MINTED':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to Waternity - Your decentralized water well management platform
        </p>
      </div>

      {/* Stats Grid */}
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
              <p className="text-2xl font-semibold text-gray-900">{mockStats.totalWells}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Wells</p>
              <p className="text-2xl font-semibold text-gray-900">{mockStats.activeWells}</p>
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
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(mockStats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Payouts</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(mockStats.totalPayouts)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wells Overview */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Wells Overview</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockWells.map((well) => (
                <div key={well.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-card-hover transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{well.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(well.status)}`}>
                        {well.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{well.code} • {well.location}</p>
                    <p className="text-xs text-gray-400 mt-1">Operator: {well.operator.name}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{well._count.events} events</span>
                    <span>{well._count.documents} docs</span>
                    <Link 
                      href={`/well/${well.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link 
                href="/admin" 
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All Wells →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockStats.recentEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                      {event.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                      <span>{formatDate(event.timestamp)}</span>
                      {event.wellCode && (
                        <>
                          <span>•</span>
                          <span>{event.wellCode}</span>
                        </>
                      )}
                      {event.txId && (
                        <>
                          <span>•</span>
                          <a 
                            href={`https://hashscan.io/testnet/transaction/${event.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View TX
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link 
                href="/admin" 
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All Activity →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/investor" 
            className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Investor Portal</h3>
                <p className="text-sm text-gray-500">View investments & returns</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/operator" 
            className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Operator Panel</h3>
                <p className="text-sm text-gray-500">Manage well operations</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/agent" 
            className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Agent Interface</h3>
                <p className="text-sm text-gray-500">Verify & validate data</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin" 
            className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Admin Dashboard</h3>
                <p className="text-sm text-gray-500">System administration</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}