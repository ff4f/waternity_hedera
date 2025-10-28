import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Build daily time series from AssetPerformance if available; otherwise fallback
    const perf = await prisma.assetPerformance.findMany({
      orderBy: { period: 'asc' },
      select: { period: true, revenue: true, waterProduced: true }
    })

    if (perf.length > 0) {
      const days = perf.map(p => ({
        date: p.period,
        revenue: Math.round(p.revenue || 0),
        volume: Math.round(p.waterProduced || 0)
      }))
      return NextResponse.json(days)
    }

    // Fallback mock: last 30 days
    const now = Date.now()
    const days = Array.from({ length: 30 }, (_, i) => {
      const ts = now - (29 - i) * 24 * 60 * 60 * 1000
      return {
        date: new Date(ts).toISOString().slice(0, 10),
        revenue: Math.round(50000 + Math.random() * 50000),
        volume: Math.round(100000 + Math.random() * 150000)
      }
    })
    return NextResponse.json(days)
  } catch (e) {
    console.error('[demo/chart] error', e)
    const now = Date.now()
    const days = Array.from({ length: 30 }, (_, i) => {
      const ts = now - (29 - i) * 24 * 60 * 60 * 1000
      return {
        date: new Date(ts).toISOString().slice(0, 10),
        revenue: Math.round(50000 + Math.random() * 50000),
        volume: Math.round(100000 + Math.random() * 150000)
      }
    })
    return NextResponse.json(days)
  }
}