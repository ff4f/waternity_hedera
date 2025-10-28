import React from 'react'
import ProofPill from './ProofPill'

export type Pool = { name: string; tvl: number; apr: number; volume24h: number; lastTx: string }

export default function PoolsCard({ pool }: { pool: Pool }) {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-emerald-100">{pool.name}</h4>
          <p className="text-sm text-slate-700 dark:text-emerald-200">TVL: ${pool.tvl.toLocaleString()} • APR: {pool.apr}% • 24h Vol: ${pool.volume24h.toLocaleString()}</p>
        </div>
        <ProofPill txId={pool.lastTx} />
      </div>
    </div>
  )
}