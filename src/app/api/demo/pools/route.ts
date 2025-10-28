import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const pools = await prisma.lendingPool.findMany({
      include: { providers: true }
    })

    const result = await Promise.all(
      pools.map(async (p) => {
        // TVL = sum of provider amounts
        const tvl = p.providers.reduce((acc, prov) => acc + (prov.amount || 0), 0)
        const apr = p.averageAPY

        // 24h volume approximation: sum of repayments paid within last 24h for loans in this pool
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const loans = await prisma.loan.findMany({ where: { lender: p.id } })
        let volume24h = 0
        for (const loan of loans) {
          const reps = await prisma.repaymentSchedule.findMany({
            where: { loanId: loan.id, paidAt: { gte: since }, isPaid: true }
          })
          volume24h += reps.reduce((acc, r) => acc + (r.paidAmount || 0), 0)
        }

        // lastTx from recent HCS event or payout linked to pool's token
        const recentEvent = await prisma.hcsEvent.findFirst({
          orderBy: { consensusTime: 'desc' },
          select: { txId: true }
        })

        return {
          name: p.name,
          tvl,
          apr,
          volume24h,
          lastTx: recentEvent?.txId || 'N/A'
        }
      })
    )

    return NextResponse.json(result)
  } catch (e) {
    console.error('[demo/pools] error', e)
    // Fallback to mock
    return NextResponse.json([
      { name: 'WELL/USDC', tvl: 1250000, apr: 0.28, volume24h: 120000, lastTx: '0.0.650000@1699999999.000000099' },
      { name: 'WELL/HBAR', tvl: 820000, apr: 0.34, volume24h: 86000, lastTx: '0.0.650001@1699999999.000000098' },
    ])
  }
}