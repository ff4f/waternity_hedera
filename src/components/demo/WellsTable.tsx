import React from 'react'
import ProofPill from './ProofPill'

export type Well = { id: string; location: string; flow: number; valve: 'open'|'closed'; txId: string; status: 'operational'|'alert'|'offline' }

export default function WellsTable({ wells }: { wells: Well[] }) {
  const statusColor = (s: Well['status']) => s === 'operational' ? 'text-emerald-500' : s === 'alert' ? 'text-amber-500' : 'text-rose-500'
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
          <tr>
            <th className="text-left p-3">Well</th>
            <th className="text-left p-3">Location</th>
            <th className="text-left p-3">Flow (L/min)</th>
            <th className="text-left p-3">Valve</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Proof</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {wells.map(w => (
            <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
              <td className="p-3 font-medium">{w.id}</td>
              <td className="p-3">{w.location}</td>
              <td className="p-3">{w.flow}</td>
              <td className="p-3">{w.valve}</td>
              <td className={`p-3 ${statusColor(w.status)}`}>{w.status}</td>
              <td className="p-3"><ProofPill txId={w.txId} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}