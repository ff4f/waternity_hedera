"use client"
import React from 'react'
import StatusBadge from './StatusBadge'
import ProofPill from './ProofPill'

export type Tx = { id: string; type: string; asset: string; amount: number; status: 'success'|'pending'|'failed'; txId: string }

export default function DataTable({ rows }: { rows: Tx[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-emerald-200">
          <tr>
            <th className="text-left p-3">Type</th>
            <th className="text-left p-3">Asset</th>
            <th className="text-left p-3">Amount</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Proof</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-emerald-100">
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <td className="p-3">{r.type}</td>
              <td className="p-3">{r.asset}</td>
              <td className="p-3">{r.amount.toLocaleString()}</td>
              <td className="p-3"><StatusBadge status={r.status} /></td>
              <td className="p-3"><ProofPill txId={r.txId} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}