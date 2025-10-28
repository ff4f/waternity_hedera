import React from 'react'
import ProofPill from './ProofPill'

export type Identity = { role: string; credentials: { name: string; issuer: string; issuedAt: string; txId: string }[] }

export default function IdentityCard({ identity }: { identity: Identity }) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
      <h4 className="font-semibold">Role: {identity.role}</h4>
      <div className="mt-3 space-y-2">
        {identity.credentials.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-slate-500">Issuer: {c.issuer} • {new Date(c.issuedAt).toLocaleDateString()}</div>
            </div>
            <ProofPill txId={c.txId} />
          </div>
        ))}
      </div>
    </div>
  )
}