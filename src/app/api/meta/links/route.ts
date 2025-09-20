import { NextRequest, NextResponse } from 'next/server';
import { getWellById } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const wellId = searchParams.get('wellId');

  if (!wellId) {
    return NextResponse.json({ error: 'wellId is required' }, { status: 400 });
  }

  try {
    const well = await getWellById(wellId);

    if (!well) {
      return NextResponse.json({ error: 'Well not found' }, { status: 404 });
    }

    return NextResponse.json({
      hashscanTopicUrl: `https://hashscan.io/mainnet/topic/${well.topicId}`,
      mirrorTopicUrl: `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${well.topicId}/messages`,
      tokenId: well.tokenId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}