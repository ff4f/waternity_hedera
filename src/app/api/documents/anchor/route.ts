import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { bundleMonthlyReport } from '@/lib/hedera/hfs';
import { createHederaClient } from '@/lib/hedera/client';
import { eventEmitter } from '@/lib/events/emitter';

export async function POST(req: NextRequest) {
  try {
    const {
      messageId,
      wellId,
      cid,
      digestAlgo,
      digestHex,
      bundleContent,
    } = await req.json();

    if (!messageId || !wellId || !cid || !digestAlgo || !digestHex) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let hfsFileId: string | undefined;

    if (bundleContent) {
      const client = createHederaClient();
      const contentBytes = Buffer.from(bundleContent, 'base64');
      const { fileId } = await bundleMonthlyReport({ wellId, contentBytes, client });
      hfsFileId = fileId;
    }

    const document = await prisma.document.create({
      data: {
        well: {
          connect: {
            id: wellId,
          },
        },
        type: 'MONTHLY_REPORT',
        cid,
        hfsFileId,
      },
    });

    const anchor = await prisma.anchor.create({
      data: {
        sourceType: 'DOCUMENT',
        sourceId: document.id,
        hcsEventId: messageId,
        digestAlgo,
        digestHex,
      },
    });

    eventEmitter.emit('DOC_ANCHORED', { document, anchor });

    return NextResponse.json({ document, anchor });
  } catch (error) {
    console.error('Error anchoring document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}