import { NextRequest, NextResponse } from 'next/server';
import { WaternityService } from '@server/lib/waternity-service';

const waternityService = new WaternityService();
waternityService.initialize({ skipHederaInit: true });

export async function POST(req: NextRequest) {
  try {
    const { settlementId } = await req.json();

    if (!settlementId) {
      return NextResponse.json({ error: 'Settlement ID is required' }, { status: 400 });
    }

    // Find the settlement data from your database or service
    const settlement = waternityService.getSettlement(settlementId);

    if (!settlement) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    }

    // Process the settlement to get the distribution result
    const distributionResult = await waternityService.processSettlement(settlement);

    return NextResponse.json({ distributionResult });
  } catch (error) {
    console.error('Error processing settlement:', error);
    return NextResponse.json({ error: 'Failed to process settlement' }, { status: 500 });
  }
}