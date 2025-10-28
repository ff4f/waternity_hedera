import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assets = await prisma.tokenizedAsset.findMany()

    const result = await Promise.all(
      assets.map(async (asset) => {
        let md: any = {}
        try { md = asset.metadata ? JSON.parse(asset.metadata) : {} } catch {}

        const name: string = md?.wellCode ? `Well ${md.wellCode}` : (md?.symbol || `Asset ${asset.tokenId}`)
        const symbol: string = md?.symbol || 'ASSET'

        const holders = await prisma.fractionalOwnership.findMany({
          where: { assetId: asset.id },
          select: { owner: true },
          distinct: ['owner']
        })

        let splits: Record<string, number> | undefined
        if (md?.wellCode) {
          const well = await prisma.well.findUnique({
            where: { code: md.wellCode },
            select: { memberships: true }
          })
          if (well && well.memberships.length > 0) {
            const totalBps = well.memberships.reduce((acc, m) => acc + (m.shareBps || 0), 0) || 10000
            const sumByRole = (role: string) => well.memberships
              .filter(m => m.roleName === role)
              .reduce((acc, m) => acc + (m.shareBps || 0), 0)
            const pct = (n: number) => Math.round((n / totalBps) * 100)
            splits = {
              Investors: pct(sumByRole('INVESTOR')),
              Operator: pct(sumByRole('OPERATOR')),
              Agent: pct(sumByRole('AGENT'))
            }
          }
        }

        return {
          name,
          symbol,
          supply: asset.totalSupply,
          holders: holders.length,
          tokenId: asset.tokenId,
          splits
        }
      })
    )

    return NextResponse.json(result)
  } catch (e) {
    console.error('[demo/tokens] error', e)
    // Fallback to mock to keep UI working
    return NextResponse.json([
      { name: 'Well WL-001', symbol: 'WELL1', supply: 1000000, holders: 342, tokenId: '0.0.500500', splits: { Community: 70, Operator: 20, Maintenance: 10 } },
      { name: 'Well WL-002', symbol: 'WELL2', supply: 500000, holders: 210, tokenId: '0.0.500501', splits: { Community: 70, Operator: 20, Maintenance: 10 } },
      { name: 'Well WL-003', symbol: 'WELL3', supply: 750000, holders: 145, tokenId: '0.0.500502', splits: { Community: 70, Operator: 20, Maintenance: 10 } },
    ])
  }
}