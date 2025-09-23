import { NextRequest, NextResponse } from 'next/server';
import { getAuditReport } from '@/lib/db/queries';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wellId = searchParams.get('wellId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const format = searchParams.get('format') || 'json';

    if (!wellId || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required query parameters: wellId, from, to' },
        { status: 400 },
      );
    }

    const auditData = await getAuditReport({
      wellId,
      periodStart: new Date(from),
      periodEnd: new Date(to),
    });

    if (format === 'csv') {
      const records = auditData.flatMap((settlement: any) => {
        // Get HCS events for this settlement period
        const hcsEvents = settlement.well?.events || [];
        const hfsFileIds = settlement.well?.documents?.map((doc: any) => doc.hfsFileId).filter(Boolean) || [];
        
        const baseRecord = {
          settlementId: settlement.id,
          wellId: settlement.wellId,
          periodStart: settlement.periodStart,
          periodEnd: settlement.periodEnd,
          kwhTotal: settlement.kwhTotal,
          grossRevenue: settlement.grossRevenue,
          status: settlement.status,
          // Proof columns
          consensusTime: hcsEvents[0]?.consensusTime || null,
          sequenceNumber: hcsEvents[0]?.sequenceNumber || null,
          txId: hcsEvents[0]?.txId || null,
          topicId: settlement.well?.topicId,
          tokenId: settlement.well?.tokenId,
          hfsFileId: hfsFileIds[0] || null,
          hashscanUrl: `https://hashscan.io/mainnet/topic/${settlement.well?.topicId}`,
          mirrorUrl: `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${settlement.well?.topicId}/messages`,
        };
        
        if (!settlement.payouts || settlement.payouts.length === 0) {
          return baseRecord;
        }
        
        return settlement.payouts.map((payout: any) => ({
          ...baseRecord,
          payoutId: payout.id,
          recipientAccount: payout.recipientAccount,
          assetType: payout.assetType,
          amount: payout.amount,
          payoutTokenId: payout.tokenId,
          payoutTxId: payout.txId,
          payoutStatus: payout.status,
        }));
      });

      const csv = stringify(records, { header: true });
      const filename = `audit_${wellId}_${from}_${to}.csv`;
      
      return new Response(csv, { 
        headers: { 
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        } 
      });
    } else {
      return NextResponse.json(auditData);
    }
  } catch (error) {
    console.error('Error fetching audit report:', error);
    return NextResponse.json({ error: 'Failed to fetch audit report' }, { status: 500 });
  }
}