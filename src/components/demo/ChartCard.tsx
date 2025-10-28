"use client"
import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'

const AreaChart = dynamic(() => import('recharts').then(m => ({ default: m.AreaChart })), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => ({ default: m.Area })), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false })

export default function ChartCard({ data, mode }: { data: any[]; mode: 'revenue'|'volume' }) {
  const color = mode === 'revenue' ? '#8b5cf6' : '#22c55e'
  const key = mode
  const chartData = useMemo(() => data, [data])
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 p-4 shadow-lg h-80">
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          {/* @ts-ignore */}
          <defs>
            <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          {/* @ts-ignore */}
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          {/* @ts-ignore */}
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
          {/* @ts-ignore */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {/* @ts-ignore */}
          <Tooltip />
          {/* @ts-ignore */}
          <Area type="monotone" dataKey={key} stroke={color} fillOpacity={1} fill="url(#colorFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}