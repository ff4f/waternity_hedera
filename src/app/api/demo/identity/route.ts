import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // pick any operator user
    const operator = await prisma.user.findFirst({
      where: { role: { is: { name: 'OPERATOR' } } },
      include: { role: true }
    })

    const roleName = operator?.role?.name || 'USER'

    // map operator's hederaAccount to DID wallet
    let wallet = null
    if (operator?.hederaAccountId) {
      wallet = await prisma.identityWallet.findFirst({
        where: { accountId: operator.hederaAccountId }
      })
    }

    let credentials: { name: string; issuer: string; issuedAt: string; txId: string }[] = []
    if (wallet) {
      const creds = await prisma.digitalCredential.findMany({
        where: { subject: wallet.did, isRevoked: false },
        orderBy: { issuanceDate: 'desc' }
      })
      credentials = creds.map(c => ({
        name: c.type,
        issuer: c.issuer,
        issuedAt: c.issuanceDate.toISOString(),
        txId: wallet?.accountId ? `${wallet.accountId}@${Math.floor(c.issuanceDate.getTime()/1000)}.000000001` : 'N/A'
      }))
    }

    return NextResponse.json({ role: roleName, credentials })
  } catch (e) {
    console.error('[demo/identity] error', e)
    return NextResponse.json({
      role: 'OPERATOR',
      credentials: [
        { name: 'Phone Verified', issuer: 'THG Identity', issuedAt: new Date().toISOString(), txId: '0.0.700001@1699999999.000000111' },
        { name: 'Email Verified', issuer: 'THG Identity', issuedAt: new Date().toISOString(), txId: '0.0.700002@1699999999.000000112' },
        { name: 'Company KYC', issuer: 'Watermity Ltd', issuedAt: new Date().toISOString(), txId: '0.0.700003@1699999999.000000113' }
      ]
    })
  }
}