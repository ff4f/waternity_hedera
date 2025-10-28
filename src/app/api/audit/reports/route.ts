import { NextRequest, NextResponse } from 'next/server';
import { getAuditReport } from '@/lib/db/queries';
import { stringify } from 'csv-stringify/sync';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role for audit reports
    const user = await requireUser(request);
    assertRole(user, 'ADMIN');
    
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
      const records: any[] = [];
      
      auditData.forEach((settlement: any) => {
        const hcsEvents = settlement.well?.events || [];
        const hfsFileIds = settlement.well?.documents?.map((doc: any) => doc.hfsFileId).filter(Boolean) || [];
        const topicId = settlement.well?.topicId;
        const tokenId = settlement.well?.tokenId;
        const hfsFileId = hfsFileIds[0];
        
        // Create records for each HCS event
        hcsEvents.forEach((event: any) => {
          const baseRecord = {
            eventType: event.type,
            wellId: settlement.wellId,
            consensusTime: event.consensusTime?.toISOString() || '',
            sequenceNumber: event.sequenceNumber?.toString() || '',
            txId: event.txId || '',
            topicId: topicId || '',
            tokenId: tokenId || '',
            hfsFileId: hfsFileId || '',
            actor: JSON.parse(event.payloadJson || '{}')?.triggeredBy || '',
            notes: `Settlement: ${settlement.id}, Status: ${settlement.status}`,
            hashscanUrl: topicId ? `https://hashscan.io/mainnet/topic/${topicId}` : '',
            mirrorUrl: topicId ? `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topicId}/messages` : '',
          };
          
          // Add settlement records
          records.push({
            ...baseRecord,
            notes: `Settlement ${settlement.id}: ${settlement.status}, Period: ${settlement.periodStart} to ${settlement.periodEnd}`,
          });
          
          // Add payout records for this event if payouts exist
          settlement.payouts?.forEach((payout: any) => {
            records.push({
              ...baseRecord,
              notes: `Payout ${payout.id}: ${payout.assetType} ${payout.amount} to ${payout.recipientAccount}, Status: ${payout.status}`,
              actor: payout.recipientAccount,
            });
          });
        });
        
        // If no HCS events, still create settlement and payout records
        if (hcsEvents.length === 0) {
          const baseRecord = {
            eventType: 'SETTLEMENT_RECORD',
            wellId: settlement.wellId,
            consensusTime: settlement.createdAt?.toISOString() || '',
            sequenceNumber: '',
            txId: '',
            topicId: topicId || '',
            tokenId: tokenId || '',
            hfsFileId: hfsFileId || '',
            actor: '',
            notes: `Settlement ${settlement.id}: ${settlement.status}, Period: ${settlement.periodStart} to ${settlement.periodEnd}`,
            hashscanUrl: topicId ? `https://hashscan.io/mainnet/topic/${topicId}` : '',
            mirrorUrl: topicId ? `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topicId}/messages` : '',
          };
          
          records.push(baseRecord);
          
          settlement.payouts?.forEach((payout: any) => {
            records.push({
              ...baseRecord,
              eventType: 'PAYOUT_RECORD',
              notes: `Payout ${payout.id}: ${payout.assetType} ${payout.amount} to ${payout.recipientAccount}, Status: ${payout.status}`,
              actor: payout.recipientAccount,
            });
          });
        }
      });

      // Sort records by consensusTime
      records.sort((a, b) => new Date(a.consensusTime).getTime() - new Date(b.consensusTime).getTime());
      
      const csv = stringify(records, { 
        header: true,
        columns: [
          'eventType',
          'wellId', 
          'consensusTime',
          'sequenceNumber',
          'txId',
          'topicId',
          'tokenId',
          'hfsFileId',
          'actor',
          'notes',
          'hashscanUrl',
          'mirrorUrl'
        ]
      });
      
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
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    return NextResponse.json({ error: 'Failed to fetch audit report' }, { status: 500 });
  }
}