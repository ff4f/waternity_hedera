import { NextRequest, NextResponse } from 'next/server';
import { getAuditReport } from '@/lib/db/queries';
import { stringify } from 'csv-stringify/sync';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wellId = searchParams.get('wellId');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const format = searchParams.get('format') || 'json';

    if (!wellId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required query parameters: wellId, periodStart, periodEnd' },
        { status: 400 },
      );
    }

    const auditData = await getAuditReport({
      wellId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    });

    if (format === 'csv') {
      const records = auditData.flatMap((settlement) => {
        const settlementRecord = {
          settlementId: settlement.id,
          wellId: settlement.wellId,
          periodStart: settlement.periodStart,
          periodEnd: settlement.periodEnd,
          kwhTotal: settlement.kwhTotal,
          grossRevenue: settlement.grossRevenue,
          status: settlement.status,
          hashscanTopicUrl: `https://hashscan.io/mainnet/topic/${settlement.well.topicId}`,
          mirrorTopicUrl: `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${settlement.well.topicId}/messages`,
          tokenId: settlement.well.tokenId,
        };
        if (settlement.payouts.length === 0) {
          return settlementRecord;
        }
        return settlement.payouts.map((payout) => ({
          ...settlementRecord,
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
      return new Response(csv, { headers: { 'Content-Type': 'text/csv' } });
    } else {
      return NextResponse.json(auditData);
    }
  } catch (error) {
    console.error('Error fetching audit report:', error);
    return NextResponse.json({ error: 'Failed to fetch audit report' }, { status: 500 });
  }
}