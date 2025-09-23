import { NextRequest, NextResponse } from 'next/server';
import { getWellById } from '@/lib/db/queries';
import { prisma } from '@/lib/db/prisma';

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

    // Get documents with HFS file IDs for this well
    const documents = await prisma.document.findMany({
      where: { wellId },
      select: { hfsFileId: true },
      take: 1,
    });

    const response: any = {
      hashscan: {
        topic: `https://hashscan.io/mainnet/topic/${well.topicId}`,
      },
      mirror: {
        topic: `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${well.topicId}/messages`,
      },
    };

    // Add token URL if tokenId exists
    if (well.tokenId) {
      response.hashscan.token = `https://hashscan.io/mainnet/token/${well.tokenId}`;
    }

    // Add file URL if hfsFileId exists
    const hfsFileId = documents[0]?.hfsFileId;
    if (hfsFileId) {
      response.hashscan.file = `https://hashscan.io/mainnet/file/${hfsFileId}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}