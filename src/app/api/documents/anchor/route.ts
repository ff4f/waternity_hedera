import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createOrAppendFile } from '@/lib/hedera/hfs';
import { submitMessage } from '@/lib/hedera/hcs';
import { getOperator } from '@/lib/hedera/client';
import { withSchema } from '@/lib/validator/withSchema';
import { ensureIdempotent } from '@/lib/validator/idempotency';



async function anchorDocumentHandler(req: NextRequest, context?: any) {
  const body = (req as any).parsedBody;
  const {
    messageId,
    wellId,
    type,
    cid,
    digestAlgo,
    digestHex,
    bundleContentBase64
  } = body;

  const result = await ensureIdempotent(
    messageId,
    'documents_anchor',
    async () => {
      let hfsFileId: string | undefined;

      // If bundleContentBase64 present → encode to bytes and call createOrAppendFile → record hfsFileId
      if (bundleContentBase64) {
        const { client } = getOperator();
        const contentBytes = Buffer.from(bundleContentBase64, 'base64');
        const { fileId } = await createOrAppendFile(contentBytes, client);
        hfsFileId = fileId;
      }

      // Create Document + Anchor DB rows
       const document = await prisma.document.create({
         data: {
           well: {
             connect: {
               id: wellId,
             },
           },
           type,
           cid: cid || '',
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

      // Emit DOC_ANCHORED via HCS with {documentId, cid, digestAlgo, digestHex, hfsFileId?}
      await submitMessage(wellId, {
        type: 'DOC_ANCHORED',
        payload: {
          documentId: document.id,
          cid: cid || '',
          digestAlgo,
          digestHex,
          hfsFileId
        }
      });

      return NextResponse.json({ 
        documentId: document.id,
        anchorId: anchor.id,
        hfsFileId 
      });
    }
  );

  return result.result || NextResponse.json({ error: "Operation failed" }, { status: 500 });
}

export const POST = withSchema('anchor_doc.schema.json', anchorDocumentHandler);