import React from 'react'
import ProofPill from './ProofPill'

export type Token = { name: string; symbol: string; supply: number; holders: number; tokenId: string; splits?: Record<string, number> }

export default function TokenCard({ token }: { token: Token }) {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-emerald-100">{token.name} <span className="text-slate-700 dark:text-emerald-200">({token.symbol})</span></h4>
          <p className="text-sm text-slate-700 dark:text-emerald-200">Supply: {token.supply.toLocaleString()} • Holders: {token.holders}</p>
        </div>
        <ProofPill txId={token.tokenId} />
      </div>
      {token.splits && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Object.entries(token.splits).map(([k,v]) => (
            <div key={k} className="flex items-center justify-between text-sm text-slate-900 dark:text-emerald-100">
              <span className="text-slate-700 dark:text-emerald-200">{k}</span>
              <span className="font-medium">{v}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}