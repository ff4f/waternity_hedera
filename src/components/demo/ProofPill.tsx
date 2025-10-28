"use client"
import React from 'react'
import { hashscanTx } from '@/lib/hashscan'

export default function ProofPill({ txId, network = 'testnet' }: { txId: string; network?: 'testnet'|'mainnet'|'previewnet' }) {
  const url = hashscanTx(txId, network)
  const short = `${txId.slice(0, 8)}...${txId.slice(-6)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(txId) } catch {}
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 text-white px-3 py-1 text-xs">
      <a className="underline decoration-dotted" href={url} target="_blank" rel="noreferrer">Proof</a>
      <span className="opacity-70 font-mono">{short}</span>
      <button onClick={copy} className="opacity-70 hover:opacity-100">Copy</button>
    </div>
  )
}