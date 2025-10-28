import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Investor Portal - Waternity',
  description: 'Investment portfolio and returns tracking for water well projects',
}

// Mock data for investor dashboard
const mockInvestorData = {
  totalInvestment: 25000.00,
  currentValue: 28750.50,
  totalReturns: 3750.50,
  returnRate: 15.0,
  activeInvestments: 3,
  pendingPayouts: 1250.75,
  investments: [
    {
      id: '1',
      wellId: '1',
      wellCode: 'WTR-001',
      wellName: 'Sunrise Valley Well',
      location: 'Lagos, Nigeria',
      investmentAmount: 10000.00,
      currentValue: 11500.00,
      shareBps: 2500, // 25%
      status: 'ACTIVE',
      investmentDate: new Date('2023-08-15'),
      lastPayout: new Date('2024-01-15'),
      totalReturns: 1500.00,
      monthlyReturn: 125.00
    },
    {
      id: '2',
      wellId: '2',
      wellCode: 'WTR-002',
      wellName: 'Green Hills Water Source',
      location: 'Abuja, Nigeria',
      investmentAmount: 15000.00,
      currentValue: 17250.50,
      shareBps: 3000, // 30%
      status: 'ACTIVE',
      investmentDate: new Date('2023-09-20'),
      lastPayout: new Date('2024-01-10'),
      totalReturns: 2250.50,
      monthlyReturn: 187.50
    }
  ],
  recentPayouts: [
    {
      id: '1',
      wellCode: 'WTR-001',
      amount: 125.00,
      assetType: 'HBAR',
      date: new Date('2024-01-15'),
      txId: '0.0.12345@1705315200.123456789',
      status: 'EXECUTED'
    },
    {
      id: '2',
      wellCode: 'WTR-002',
      amount: 187.50,
      assetType: 'HBAR',
      date: new Date('2024-01-10'),
      txId: '0.0.12345@1704888000.987654321',
      status: 'EXECUTED'
    },
    {
      id: '3',
      wellCode: 'WTR-001',
      amount: 125.00,
      assetType: 'HBAR',
      date: new Date('2023-12-15'),
      txId: '0.0.12345@1702636800.456789123',
      status: 'EXECUTED'
    }
  ]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

function formatHBAR(amount: number): string {
  return `${amount.toLocaleString()} ℏ`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

import { getStatusColor } from '@/lib/ui'

export default function InvestorPage() {
  const profitLoss = mockInvestorData.currentValue - mockInvestorData.totalInvestment
  const profitLossPercentage = (profitLoss / mockInvestorData.totalInvestment) * 100

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investor Portal</h1>
            <p className="text-gray-600">
              Track your water well investments and returns on the Hedera network
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary">
              Export Report
            </button>
            <button className="btn-primary">
              New Investment
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Investment</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(mockInvestorData.totalInvestment)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Value</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(mockInvestorData.currentValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                profitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={profitLoss >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Profit/Loss</p>
              <p className={`text-2xl font-semibold ${
                profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
              </p>
              <p className={`text-xs ${
                profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profitLoss >= 0 ? '+' : ''}{formatPercentage(profitLossPercentage)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Payouts</p>
              <p className="text-2xl font-semibold text-gray-900">{formatHBAR(mockInvestorData.pendingPayouts)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Investment Portfolio */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Investment Portfolio</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {mockInvestorData.investments.map((investment) => (
                <div key={investment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{investment.wellName}</h3>
                      <p className="text-sm text-gray-500">{investment.wellCode} • {investment.location}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(investment.status)}`}>
                      {investment.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Investment</p>
                      <p className="font-medium text-gray-900">{formatCurrency(investment.investmentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Current Value</p>
                      <p className="font-medium text-gray-900">{formatCurrency(investment.currentValue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Share</p>
                      <p className="font-medium text-gray-900">{formatPercentage(investment.shareBps / 100)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Monthly Return</p>
                      <p className="font-medium text-green-600">{formatHBAR(investment.monthlyReturn)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Invested: {formatDate(investment.investmentDate)}
                    </div>
                    <Link 
                      href={`/well/${investment.wellId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payouts</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockInvestorData.recentPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatHBAR(payout.amount)} from {payout.wellCode}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(payout.date)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                    <a 
                      href={`https://hashscan.io/testnet/transaction/${payout.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View TX
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All Payouts →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Opportunities */}
      <div className="mt-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">New Investment Opportunities</h3>
              <p className="text-gray-600 mb-4">
                Discover new water well projects seeking investment on the Hedera network.
                All investments are secured by smart contracts and tracked transparently.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hedera-secured transactions
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Transparent reporting
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Regular HBAR payouts
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button className="btn-primary">
                Explore Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}