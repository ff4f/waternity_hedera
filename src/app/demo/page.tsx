"use client"
import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Users, PiggyBank, Droplets, Activity } from 'lucide-react'
import KpiCard from '@/components/demo/KpiCard'
import ChartCard from '@/components/demo/ChartCard'
import DataTable, { Tx } from '@/components/demo/DataTable'
import SectionHeader from '@/components/demo/SectionHeader'
import WellsTable, { Well } from '@/components/demo/WellsTable'
import TokenCard, { Token } from '@/components/demo/TokenCard'
import PoolsCard, { Pool } from '@/components/demo/PoolsCard'
import IdentityCard, { Identity } from '@/components/demo/IdentityCard'
import dynamic from 'next/dynamic'

const ProofTray = dynamic(() => import('@/components/ui/ProofTray'), { ssr: false })

function useDemoQuery<T>(key: string, url: string) {
  return useQuery<T>({ queryKey: ['demo', key], queryFn: async () => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load '+key)
    return res.json() as Promise<T>
  }})
}

export default function DemoPage() {
  const kpis = useDemoQuery<{ assets:number; tvl:number; investors:number; returns:string }>('kpis', '/api/demo/kpis')
  const chart = useDemoQuery<{ date:string; revenue:number; volume:number }[]>('chart', '/api/demo/chart')
  const tx = useDemoQuery<Tx[]>('tx', '/api/demo/tx')
  const wells = useDemoQuery<Well[]>('wells', '/api/demo/wells')
  const tokens = useDemoQuery<Token[]>('tokens', '/api/demo/tokens')
  const pools = useDemoQuery<Pool[]>('pools', '/api/demo/pools')
  const identity = useDemoQuery<Identity>('identity', '/api/demo/identity')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 text-slate-900 dark:text-emerald-100">
      {/* Sticky Hero */}
      <div className="sticky top-0 z-20">
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-emerald-500 opacity-20 h-14 blur-md" />
        <div className="px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-white/5 border-b border-slate-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-emerald-100">Waternity Demo</h1>
              <p className="text-xs text-slate-700 dark:text-emerald-200">On-chain Water Assets • DeFi • Identity • Proofs</p>
            </div>
            <div className="text-xs text-slate-700 dark:text-emerald-200">Network: Hedera Testnet</div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Tabs defaultValue="overview">
          <TabsList className="bg-white/80 dark:bg-slate-800/60">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wells">Water Monitoring</TabsTrigger>
            <TabsTrigger value="tokenization">Asset Tokenization</TabsTrigger>
            <TabsTrigger value="defi">DeFi</TabsTrigger>
            <TabsTrigger value="identity">THG Identity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={Droplets} label="Water Assets" value={kpis.data?.assets ?? '—'} delta="+3 new" />
              <KpiCard icon={PiggyBank} label="TVL" value={kpis.data ? `$${kpis.data.tvl.toLocaleString()}` : '—'} delta="+2.1%" />
              <KpiCard icon={Users} label="Investors" value={kpis.data?.investors ?? '—'} delta="+12" />
              <KpiCard icon={Activity} label="Avg. Returns" value={kpis.data?.returns ?? '—'} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard data={chart.data ?? []} mode="revenue" />
              <ChartCard data={chart.data ?? []} mode="volume" />
            </div>

            {/* Recent Transactions */}
            <div className="space-y-3">
              <SectionHeader title="Recent Transactions" desc="Latest on-chain activity across the protocol" actions={<a href="#" className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-emerald-200 hover:underline">View all <ArrowUpRight className="h-3 w-3" /></a>} />
              <DataTable rows={tx.data ?? []} />
            </div>

            {/* Proof Tray & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-3">
                <SectionHeader title="Proof Tray" desc="Verifiable links for on-chain events" />
                {/* @ts-ignore */}
                <ProofTray />
              </div>
              <div className="space-y-3">
                <SectionHeader title="System Health" desc="Operational status across services" />
                <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-4 shadow-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-700 dark:text-emerald-200">Mirror Node</span><span className="text-emerald-600 dark:text-emerald-400">OK</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-700 dark:text-emerald-200">HCS Stream</span><span className="text-emerald-600 dark:text-emerald-400">OK</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-700 dark:text-emerald-200">Prisma DB</span><span className="text-emerald-600 dark:text-emerald-400">OK</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-700 dark:text-emerald-200">API Latency</span><span className="text-amber-600 dark:text-amber-400">152ms</span></div>
                </div>
                <SectionHeader title="Announcements" />
                <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-4 shadow-lg space-y-2 text-sm">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-emerald-100">New Well Tokenization Live</div>
                    <div className="text-slate-700 text-xs dark:text-emerald-200">We launched tokenization for Lagos community wells — view tokens tab.</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-emerald-100">APR Boost</div>
                    <div className="text-slate-700 text-xs dark:text-emerald-200">Selected pools increased APR for verified impact projects.</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Water Monitoring */}
          <TabsContent value="wells" className="space-y-6">
            <SectionHeader title="Water Monitoring" desc="Live metrics for community wells" />
            <WellsTable wells={wells.data ?? []} />
          </TabsContent>

          {/* Tokenization */}
          <TabsContent value="tokenization" className="space-y-6">
            <SectionHeader title="Asset Tokenization" desc="Real-world water assets represented on-chain" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(tokens.data ?? []).map(t => (
                <TokenCard key={t.tokenId} token={t} />
              ))}
            </div>
          </TabsContent>

          {/* DeFi */}
          <TabsContent value="defi" className="space-y-6">
            <SectionHeader title="DeFi Pools" desc="Invest and earn yield from water assets" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(pools.data ?? []).map(p => (
                <PoolsCard key={p.name} pool={p} />
              ))}
            </div>
          </TabsContent>

          {/* Identity */}
          <TabsContent value="identity" className="space-y-6">
            <SectionHeader title="THG Identity" desc="Verifiable credentials for actors in the ecosystem" />
            {identity.data && <IdentityCard identity={identity.data} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}