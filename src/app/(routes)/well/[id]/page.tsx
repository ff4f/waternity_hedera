/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import InvestorsModal from '@/components/modals/InvestorsModal'
import UploadDocumentModal from '@/components/modals/UploadDocumentModal'
import Skeleton, { WellKPISkeleton, EventsListSkeleton } from '@/components/Skeleton'
import { getStatusColor } from '@/lib/ui'

// Well detail types
interface WellTimelineEvent {
  id?: string
  type?: string
  title?: string
  description?: string
  timestamp?: Date | string
  createdAt?: Date | string
  txId?: string
  status?: string
}

interface WellDocument {
  id?: string
  name?: string
  type?: string
  size?: string
  uploadedAt?: Date
  uploadedBy?: string
}

interface Investor {
  id: string
  name: string
  investment: number
  percentage: number
  joinedAt: Date
}

interface WellLocation {
  address?: string
  region?: string
  country?: string
  coordinates?: { lat: number; lng: number } | null
  display?: string
}

interface WellTechnical {
  capacity: number
  depth: number
  pumpType: string
  installationDate: Date
  lastMaintenance: Date
  nextMaintenance: Date
}

interface WellFinancial {
  totalInvestment: number
  investorCount: number
  monthlyRevenue: number
  totalRevenue: number
  roi: number
}

interface WellProduction {
  currentMonth: number
  lastMonth: number
  yearToDate: number
  allTime: number
  efficiency: number
}

interface WellUI {
  id: string
  code: string
  name: string
  description: string
  location: WellLocation
  status: string
  operator: { id: string; name: string }
  hedera: { topicId: string; tokenId: string; accountId: string }
  technical: WellTechnical
  financial: WellFinancial
  production: WellProduction
  investors: Investor[]
  timeline: WellTimelineEvent[]
  documents: WellDocument[]
}

// API shapes to adapt from
interface ApiEvent { id?: string; type?: string; payloadJson?: string; consensusTime?: string; createdAt?: string; txId?: string }
interface ApiSettlement { status?: string; createdAt?: string; kwhTotal?: number; grossRevenue?: number; periodStart?: string }
interface ApiMembership { id?: string; shareBps?: number; createdAt?: string; user?: { id?: string; name?: string } }
interface ApiDocument { id?: string; name?: string; type?: string; createdAt?: string }
interface ApiWell {
  id?: string
  code?: string
  name?: string
  description?: string
  status?: string
  location?: unknown
  operator?: { id?: string; name?: string; hederaAccountId?: string }
  topicId?: string
  tokenId?: string
  createdAt?: string
  settlements?: ApiSettlement[]
  memberships?: ApiMembership[]
  events?: ApiEvent[]
  documents?: ApiDocument[]
}

interface WellPageProps {
  params: {
    id: string
  }
}

// Note: generateStaticParams and generateMetadata removed due to 'use client' directive

// Mock data for well details
const mockWellData = {
  '1': {
    id: '1',
    code: 'WTR-001',
    name: 'Sunrise Valley Well',
    description: 'A sustainable water extraction well serving the Sunrise Valley community with renewable energy integration.',
    location: {
      address: 'Sunrise Valley, Lagos State, Nigeria',
      coordinates: { lat: 6.5244, lng: 3.3792 },
      region: 'Lagos State',
      country: 'Nigeria'
    },
    status: 'active',
    operator: {
      id: '1',
      name: 'John Operator',
      email: 'john@example.com',
      phone: '+234-801-234-5678'
    },
    hedera: {
      topicId: '0.0.12345',
      tokenId: '0.0.23456',
      accountId: '0.0.34567'
    },
    technical: {
      capacity: 5000, // kWh/month
      depth: 150, // meters
      pumpType: 'Solar Submersible',
      installationDate: new Date('2023-06-15'),
      lastMaintenance: new Date('2024-01-10'),
      nextMaintenance: new Date('2024-04-10')
    },
    financial: {
      totalInvestment: 50000,
      investorCount: 12,
      monthlyRevenue: 4200,
      totalRevenue: 29400,
      roi: 8.5 // percentage
    },
    production: {
      currentMonth: 4750,
      lastMonth: 4680,
      yearToDate: 14130,
      allTime: 89250,
      efficiency: 95.0 // percentage
    },
    investors: [
      {
        id: '1',
        name: 'Alice Investor',
        investment: 10000,
        percentage: 20.0,
        joinedAt: new Date('2023-06-20')
      },
      {
        id: '2',
        name: 'Bob Investor',
        investment: 7500,
        percentage: 15.0,
        joinedAt: new Date('2023-07-01')
      },
      {
        id: '3',
        name: 'Carol Investor',
        investment: 5000,
        percentage: 10.0,
        joinedAt: new Date('2023-07-15')
      }
    ],
    timeline: [
      {
        id: '1',
        type: 'WELL_CREATED',
        title: 'Well Created',
        description: 'Water well project initiated and registered on Hedera',
        timestamp: new Date('2023-06-15T10:00:00Z'),
        txId: '0.0.12345@1687000000.123456789',
        status: 'completed'
      },
      {
        id: '2',
        type: 'MILESTONE_VERIFIED',
        title: 'Installation Completed',
        description: 'Solar pump installation and initial testing completed',
        timestamp: new Date('2023-08-20T14:30:00Z'),
        txId: '0.0.12345@1692540000.987654321',
        status: 'completed'
      },
      {
        id: '3',
        type: 'TOKEN_MINTED',
        title: 'Investment Tokens Minted',
        description: '50,000 WTR tokens minted for investor distribution',
        timestamp: new Date('2023-09-01T09:15:00Z'),
        txId: '0.0.23456@1693560900.456789123',
        status: 'completed'
      },
      {
        id: '4',
        type: 'PAYOUT_EXECUTED',
        title: 'Monthly Payout - January 2024',
        description: 'Revenue distribution to investors: $4,200',
        timestamp: new Date('2024-01-31T16:45:00Z'),
        txId: '0.0.12345@1706720700.789123456',
        status: 'completed'
      },
      {
        id: '5',
        type: 'SETTLEMENT_REQUESTED',
        title: 'Maintenance Settlement',
        description: 'Quarterly maintenance settlement requested',
        timestamp: new Date('2024-01-22T11:20:00Z'),
        txId: '0.0.12345@1705923600.321654987',
        status: 'pending'
      }
    ],
    documents: [
      {
        id: '1',
        name: 'Environmental Impact Assessment',
        type: 'PDF',
        size: '2.4 MB',
        uploadedAt: new Date('2023-06-10'),
        uploadedBy: 'John Operator'
      },
      {
        id: '2',
        name: 'Installation Permit',
        type: 'PDF',
        size: '1.8 MB',
        uploadedAt: new Date('2023-06-12'),
        uploadedBy: 'John Operator'
      },
      {
        id: '3',
        name: 'Monthly Production Report - Jan 2024',
        type: 'PDF',
        size: '856 KB',
        uploadedAt: new Date('2024-01-31'),
        uploadedBy: 'John Operator'
      }
    ]
  },
  '2': {
    id: '2',
    code: 'WTR-002',
    name: 'Desert Springs Well',
    description: 'Advanced water extraction facility in arid region with solar-powered pumping system.',
    location: {
      address: 'Desert Springs, Abuja FCT, Nigeria',
      coordinates: { lat: 9.0765, lng: 7.3986 },
      region: 'Abuja FCT',
      country: 'Nigeria'
    },
    status: 'maintenance',
    operator: {
      id: '2',
      name: 'Mike Supervisor',
      email: 'mike@example.com',
      phone: '+234-802-345-6789'
    },
    hedera: {
      topicId: '0.0.12346',
      tokenId: '0.0.23457',
      accountId: '0.0.34568'
    },
    technical: {
      capacity: 3500,
      depth: 200,
      pumpType: 'Solar Centrifugal',
      installationDate: new Date('2023-08-01'),
      lastMaintenance: new Date('2024-01-20'),
      nextMaintenance: new Date('2024-04-20')
    },
    financial: {
      totalInvestment: 35000,
      investorCount: 8,
      monthlyRevenue: 2800,
      totalRevenue: 16800,
      roi: 6.8
    },
    production: {
      currentMonth: 3200,
      lastMonth: 3150,
      yearToDate: 9450,
      allTime: 51200,
      efficiency: 91.4
    },
    investors: [
      {
        id: '4',
        name: 'David Investor',
        investment: 12000,
        percentage: 34.3,
        joinedAt: new Date('2023-08-05')
      },
      {
        id: '5',
        name: 'Eva Investor',
        investment: 8000,
        percentage: 22.9,
        joinedAt: new Date('2023-08-10')
      }
    ],
    timeline: [
      {
        id: '1',
        type: 'WELL_CREATED',
        title: 'Well Created',
        description: 'Desert Springs well project initiated',
        timestamp: new Date('2023-08-01T12:00:00Z'),
        txId: '0.0.12346@1690891200.123456789',
        status: 'completed'
      }
    ],
    documents: [
      {
        id: '1',
        name: 'Geological Survey Report',
        type: 'PDF',
        size: '3.2 MB',
        uploadedAt: new Date('2023-07-25'),
        uploadedBy: 'Mike Supervisor'
      }
    ]
  }
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

// getStatusColor moved to shared util '@/lib/ui'

function getEventTypeColor(eventType: string): string {
  switch (eventType) {
    case 'WELL_CREATED':
      return 'bg-blue-100 text-blue-800'
    case 'MILESTONE_VERIFIED':
      return 'bg-green-100 text-green-800'
    case 'TOKEN_MINTED':
      return 'bg-purple-100 text-purple-800'
    case 'PAYOUT_EXECUTED':
      return 'bg-yellow-100 text-yellow-800'
    case 'SETTLEMENT_REQUESTED':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case 'WELL_CREATED':
      return '🏗️'
    case 'MILESTONE_VERIFIED':
      return '✅'
    case 'TOKEN_MINTED':
      return '🪙'
    case 'PAYOUT_EXECUTED':
      return '💸'
    case 'SETTLEMENT_REQUESTED':
      return '📄'
    default:
      return '📌'
  }
}

// Normalize various location shapes into a consistent object
// Add a loose location type to support various possible fields from APIs
type LooseLocation = WellLocation & { city?: string; town?: string; state?: string; province?: string; district?: string }

function normalizeLocation(loc: LooseLocation | string | null | undefined): {
  address: string
  region: string
  country: string
  coordinates: { lat: number; lng: number } | null
  display: string
} {
  if (!loc) {
    return { address: '—', region: '—', country: '—', coordinates: null, display: '—' }
  }
  // String input (e.g., "Lagos, Nigeria")
  if (typeof loc === 'string') {
    const str = loc.trim()
    // Heuristic: last part as country, first as region
    const parts = str.split(',').map((p: string) => p.trim()).filter(Boolean)
    const country = parts.length > 0 ? parts[parts.length - 1] : '—'
    const region = parts.length > 1 ? parts[0] : str
    return { address: str, region: region, country: country, coordinates: null, display: str }
  }
  // Object input
  const address = (loc.address ?? loc.region ?? loc.city ?? loc.town ?? '—') as string
  const region = (loc.region ?? loc.state ?? loc.province ?? loc.district ?? '—') as string
  const country = (loc.country ?? '—') as string
  const coordinates = loc.coordinates && typeof loc.coordinates === 'object'
    ? ({ lat: Number(loc.coordinates.lat), lng: Number(loc.coordinates.lng) })
    : null
  const display = [region !== '—' ? region : null, country !== '—' ? country : null]
    .filter(Boolean)
    .join(', ') || (address !== '—' ? address : '—')
  return { address, region, country, coordinates, display }
}

function adaptApiWellToUi(w: unknown): WellUI {
  if (!w || typeof w !== 'object') {
    return {
      id: '', code: '', name: '', description: '',
      location: { address: '—', region: '—', country: '—', coordinates: null, display: '—' },
      status: 'inactive',
      operator: { id: '', name: '—' },
      hedera: { topicId: '—', tokenId: '—', accountId: '—' },
      technical: { capacity: 0, depth: 0, pumpType: '—', installationDate: new Date(), lastMaintenance: new Date(), nextMaintenance: new Date() },
      financial: { totalInvestment: 0, investorCount: 0, monthlyRevenue: 0, totalRevenue: 0, roi: 0 },
      production: { currentMonth: 0, lastMonth: 0, yearToDate: 0, allTime: 0, efficiency: 0 },
      investors: [], timeline: [], documents: []
    }
  }
  const aw = w as ApiWell

  const settlements = Array.isArray(aw.settlements) ? aw.settlements : []
  const executed = [...settlements]
    .filter((s: ApiSettlement) => ((s?.status ?? '').toUpperCase() === 'EXECUTED'))
    .sort((a: ApiSettlement, b: ApiSettlement) => new Date(b?.createdAt ?? Date.now()).getTime() - new Date(a?.createdAt ?? Date.now()).getTime())
  const last = executed[0]
  const prev = executed[1]

  const sumGross = settlements.reduce((acc: number, s: ApiSettlement) => acc + (Number(s?.grossRevenue) || 0), 0)
  const sumKwh = settlements.reduce((acc: number, s: ApiSettlement) => acc + (Number(s?.kwhTotal) || 0), 0)
  const now = new Date()
  const yearToDateKwh = settlements
    .filter((s: ApiSettlement) => {
      const d = new Date(s?.periodStart ?? s?.createdAt ?? now)
      return d.getFullYear() === now.getFullYear()
    })
    .reduce((acc: number, s: ApiSettlement) => acc + (Number(s?.kwhTotal) || 0), 0)

  const memberships = Array.isArray(aw.memberships) ? aw.memberships : []
  const investors: Investor[] = memberships.map((m: ApiMembership) => ({
    id: m?.user?.id ?? m?.id ?? '',
    name: m?.user?.name ?? '—',
    investment: 0,
    percentage: ((Number(m?.shareBps) || 0) / 100),
    joinedAt: new Date(m?.createdAt ?? aw?.createdAt ?? now)
  }))

  const events: WellTimelineEvent[] = Array.isArray(aw.events) ? aw.events.map((e: ApiEvent) => {
    let payload: unknown = null
    try {
      payload = e?.payloadJson ? JSON.parse(e.payloadJson) : null
    } catch (error: unknown) {
      // Ignore parsing errors
    }
    const details = typeof payload === 'object' && payload && 'details' in payload ? (payload as { details?: string }).details ?? '' : ''
    return {
      id: e?.id,
      type: e?.type ?? 'EVENT',
      title: (e?.type ?? 'Event').toString().replace(/_/g, ' '),
      description: details,
      timestamp: new Date(e?.consensusTime ?? e?.createdAt ?? now),
      txId: e?.txId,
      status: 'completed'
    }
  }) : []

  const documents: WellDocument[] = Array.isArray(aw.documents) ? aw.documents.map((d: ApiDocument) => ({
    id: d?.id,
    name: d?.name ?? 'Document',
    type: d?.type ?? 'FILE',
    size: '—',
    uploadedAt: new Date(d?.createdAt ?? now),
    uploadedBy: aw?.operator?.name ?? '—'
  })) : []

  const technical: WellTechnical = {
    capacity: Math.round(Number(last?.kwhTotal) || 0),
    depth: 0,
    pumpType: '—',
    installationDate: new Date(aw?.createdAt ?? now),
    lastMaintenance: new Date(aw?.createdAt ?? now),
    nextMaintenance: new Date(aw?.createdAt ?? now)
  }

  const financial: WellFinancial = {
    totalInvestment: 0,
    investorCount: investors.length,
    monthlyRevenue: Number(last?.grossRevenue) || 0,
    totalRevenue: sumGross,
    roi: Number(((sumGross > 0 ? (sumGross / 10000) * 100 : 0)).toFixed(1))
  }

  const production: WellProduction = {
    currentMonth: Number(last?.kwhTotal) || 0,
    lastMonth: Number(prev?.kwhTotal) || 0,
    yearToDate: yearToDateKwh,
    allTime: sumKwh,
    efficiency: last && prev ? Math.min(100, Math.round(((Number(last?.kwhTotal) || 0) / Math.max(1, Number(prev?.kwhTotal) || 1)) * 100)) : 90
  }

  const loc = normalizeLocation(aw?.location as WellLocation | string | null | undefined)

  return {
    id: aw?.id ?? '',
    code: aw?.code ?? '—',
    name: aw?.name ?? '—',
    description: (aw?.description ?? `Tokenized water well located at ${loc.display}.`).toString(),
    location: loc,
    status: (aw?.status ?? 'active') as string,
    operator: {
      id: aw?.operator?.id ?? '',
      name: aw?.operator?.name ?? '—'
    },
    hedera: {
      topicId: aw?.topicId ?? '—',
      tokenId: aw?.tokenId ?? '—',
      accountId: aw?.operator?.hederaAccountId ?? '—'
    },
    technical,
    financial,
    production,
    investors,
    timeline: events,
    documents
  }
}

export default function WellDetailPage({ params }: WellPageProps) {
  const wellId = params.id
  const [showInvestorsModal, setShowInvestorsModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [apiWell, setApiWell] = useState<WellUI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/wells/${wellId}`)
        if (!res.ok) throw new Error('Well not found')
        const data = await res.json()
        if (!cancelled) setApiWell(adaptApiWellToUi(data))
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load well'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [wellId])

  const well = apiWell ?? (mockWellData as Record<string, WellUI>)[wellId]

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-card p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton width="w-64" height="h-8" />
              <div className="flex items-center gap-2">
                <Skeleton width="w-20" height="h-6" className="rounded-full" />
                <Skeleton width="w-24" height="h-6" className="rounded-full" />
              </div>
              <Skeleton width="w-full" height="h-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton width="w-40" height="h-4" />
                <Skeleton width="w-56" height="h-4" />
                <Skeleton width="w-48" height="h-4" />
                <Skeleton width="w-32" height="h-4" />
              </div>
            </div>
            <div className="flex space-x-3">
              <Skeleton width="w-24" height="h-10" />
              <Skeleton width="w-24" height="h-10" />
            </div>
          </div>
        </div>
      
        {/* Key Metrics Skeleton */}
        <WellKPISkeleton />
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Timeline Skeleton */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-card p-6">
            <div className="mb-4">
              <Skeleton width="w-40" height="h-6" />
            </div>
            <EventsListSkeleton />
          </div>
      
          {/* Details Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <Skeleton width="w-40" height="h-6" />
              <div className="mt-4 space-y-3">
                <Skeleton width="w-full" height="h-4" />
                <Skeleton width="w-full" height="h-4" />
                <Skeleton width="w-full" height="h-4" />
                <Skeleton width="w-full" height="h-4" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <Skeleton width="w-48" height="h-6" />
              <div className="mt-4 space-y-3">
                <Skeleton width="w-64" height="h-4" />
                <Skeleton width="w-64" height="h-4" />
                <Skeleton width="w-64" height="h-4" />
              </div>
            </div>
          </div>
        </div>
      
        {/* Documents Skeleton */}
        <div className="mt-8 bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="w-40" height="h-6" />
            <Skeleton width="w-28" height="h-8" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i: number) => i).map((i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <Skeleton width="w-44" height="h-5" />
                <Skeleton width="w-24" height="h-4" />
                <div className="flex gap-2">
                  <Skeleton width="w-20" height="h-6" className="rounded-full" />
                  <Skeleton width="w-20" height="h-6" className="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!well) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Well not found</h1>
          <p className="text-sm text-gray-600 mb-6">ID: {wellId}. {error ? `Error: ${error}` : 'This resource may have been deleted or the link is invalid.'}</p>
          <Link href="/wells" className="btn-primary">Back to Wells</Link>
        </div>
      </div>
    )
  }

  const locationText = typeof well?.location === 'string'
    ? well.location
    : well?.location?.display ?? well?.location?.region ?? well?.location?.address ?? 'N/A'

  const timelineEvents: WellTimelineEvent[] = Array.isArray(well?.timeline)
    ? well.timeline
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Wells</span>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{well?.code ?? '—'}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Well Header */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{well?.name ?? '—'}</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(well.status)}`}>
                {well.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{well.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Well Code:</span>
                <span className="ml-2 font-medium">{well.code}</span>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2 font-medium">{locationText}</span>
              </div>
              <div>
                <span className="text-gray-500">Operator:</span>
                <span className="ml-2 font-medium">{well.operator?.name ?? '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Capacity:</span>
                <span className="ml-2 font-medium">{formatNumber(well.technical.capacity)} kWh/month</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary">
              Export Data
            </button>
            <button className="btn-primary">
              Invest Now
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-500">Monthly Production</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(well.production.currentMonth)}</p>
              <p className="text-xs text-gray-500">kWh this month</p>
            </div>
          </div>
        </div>

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
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(well.financial.totalInvestment)}</p>
              <p className="text-xs text-gray-500">{well.financial.investorCount} investors</p>
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
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(well.financial.monthlyRevenue)}</p>
              <p className="text-xs text-gray-500">{well.financial.roi}% ROI</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900">{well.production.efficiency}%</p>
              <p className="text-xs text-gray-500">operational efficiency</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Well Timeline</h2>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {(timelineEvents as WellTimelineEvent[]).map((event: WellTimelineEvent, eventIdx: number) => (
                  <li key={event.id ?? eventIdx}>
                    <div className="relative pb-8">
                      {eventIdx !== timelineEvents.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                            {getEventIcon(event.type ?? 'EVENT')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor((event?.type ?? 'EVENT'))}`}>
                                {(event?.type ?? 'EVENT').toString().replace('_', ' ')}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor((event?.status ?? 'completed'))}`}>
                                {(event?.status ?? 'completed').toString().toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{event?.title ?? 'Event'}</p>
                            <p className="text-sm text-gray-500">{event?.description ?? ''}</p>
                            <div className="mt-2">
                              <a 
                                href={`https://hashscan.io/testnet/transaction/${event.txId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                View Transaction →
                              </a>
                            </div>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time dateTime={(event?.timestamp ?? event?.createdAt ?? new Date()).toString()}>{formatDateTime(new Date(event?.timestamp ?? event?.createdAt ?? Date.now()))}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Well Details */}
        <div className="space-y-6">
          {/* Technical Details */}
          <div className="bg-white rounded-lg shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Technical Details</h3>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Depth</dt>
                  <dd className="text-sm font-medium text-gray-900">{well.technical.depth}m</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Pump Type</dt>
                  <dd className="text-sm font-medium text-gray-900">{well.technical.pumpType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Installation</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatDate(well.technical.installationDate)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Last Maintenance</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatDate(well.technical.lastMaintenance)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Next Maintenance</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatDate(well.technical.nextMaintenance)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Hedera Integration */}
          <div className="bg-white rounded-lg shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Hedera Integration</h3>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500 mb-1">HCS Topic ID</dt>
                  <dd className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{well.hedera.topicId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">HTS Token ID</dt>
                  <dd className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{well.hedera.tokenId}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-1">Account ID</dt>
                  <dd className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{well.hedera.accountId}</dd>
                </div>
              </dl>
              <div className="mt-6">
                <a 
                  href={`https://hashscan.io/testnet/topic/${well.hedera.topicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full text-center text-sm"
                >
                  View on Hashscan →
                </a>
              </div>
            </div>
          </div>

          {/* Top Investors */}
          <div className="bg-white rounded-lg shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Investors</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {(well.investors ?? []).slice(0, 3).map((investor: { id: string; name: string; investment: number; percentage: number; joinedAt: Date }) => (
                  <div key={investor.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{investor.name}</p>
                      <p className="text-xs text-gray-500">Joined {formatDate(investor.joinedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(investor.investment)}</p>
                      <p className="text-xs text-gray-500">{investor.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button 
                  className="w-full btn-secondary text-sm"
                  onClick={() => setShowInvestorsModal(true)}
                  disabled={(well?.investors ?? []).length === 0}
                >
                  View All Investors
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <button 
                className="btn-primary text-sm"
                onClick={() => setShowUploadModal(true)}
              >
                Upload Document
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(well.documents ?? []).map((doc: WellDocument) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{doc.name}</h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size ?? '—'}</span>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Uploaded by {doc.uploadedBy}</p>
                    <p>{formatDate(doc.uploadedAt ?? new Date())}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <InvestorsModal 
        isOpen={showInvestorsModal}
        onClose={() => setShowInvestorsModal(false)}
        wellName={well?.name ?? '—'}
        investors={(well?.investors ?? [])}
      />
      
      <UploadDocumentModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        wellName={well?.name ?? '—'}
        onUpload={(file, metadata) => {
          console.log('Uploading file:', file.name, 'with metadata:', metadata)
          alert(`Document "${metadata.name}" uploaded successfully!`)
        }}
      />
    </div>
  )
}