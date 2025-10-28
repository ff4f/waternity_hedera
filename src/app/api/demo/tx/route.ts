import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Use latest Payouts and HCS Events as recent transactions
    const [payouts, events] = await Promise.all([
      prisma.payout.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, assetType: true, amount: true, status: true, txId: true }
      }),
      prisma.hcsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, txId: true }
      })
    ])

    const tx = [
      ...payouts.map(p => ({ id: p.id, type: 'Settlement', asset: p.assetType, amount: Math.round(p.amount || 0), status: (p.status?.toLowerCase() as 'success'|'pending'|'failed') || 'success', txId: p.txId || '' })),
      ...events.map(e => ({ id: e.id, type: e.type, asset: 'Well', amount: 0, status: 'success' as const, txId: e.txId || '' }))
    ]

    return NextResponse.json(tx)
  } catch (e) {
    console.error('[demo/tx] error', e)
    const sampleTx = (id: string, type: string, asset: string, amount: number, status: 'success'|'pending'|'failed', txId: string) => ({
      id, type, asset, amount, status, txId
    })
    const tx = [
      sampleTx('tx-1', 'Tokenization', 'Well WL-001', 50000, 'success', '0.0.1234567@1699999999.000000000'),
      sampleTx('tx-2', 'Loan Disbursement', 'Coop A', 25000, 'pending', '0.0.7654321@1699999999.000000001'),
      sampleTx('tx-3', 'Credential Issued', 'Operator', 0, 'success', '0.0.9876543@1699999999.000000002'),
      sampleTx('tx-4', 'Valve Command', 'WL-002', 0, 'failed', '0.0.2233445@1699999999.000000003'),
      sampleTx('tx-5', 'Settlement', 'Pool WELL/USDC', 8900, 'success', '0.0.9988776@1699999999.000000004'),
    ]
    return NextResponse.json(tx)
  }
}