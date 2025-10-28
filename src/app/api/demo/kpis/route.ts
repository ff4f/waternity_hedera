import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [assets, tvlAgg, providers, pools] = await Promise.all([
      prisma.well.count(),
      prisma.liquidityProvider.aggregate({ _sum: { amount: true } }),
      prisma.liquidityProvider.findMany({ select: { provider: true }, distinct: ['provider'] }),
      prisma.lendingPool.findMany({ select: { averageAPY: true } })
    ])

    const tvl = tvlAgg._sum.amount ?? 0
    const investors = providers.length
    const avgApy = pools.length > 0
      ? `${(pools.reduce((acc, p) => acc + (p.averageAPY || 0), 0) / pools.length).toFixed(1)}%`
      : '—'

    return NextResponse.json({
      assets,
      tvl,
      investors,
      returns: avgApy
    })
  } catch (e) {
    console.error('[demo/kpis] error', e)
    // Fallback to mock to keep UI working
    return NextResponse.json({
      assets: 25,
      tvl: 3500000,
      investors: 1250,
      returns: '12.5%'
    })
  }
}