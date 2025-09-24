import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createOrAppendFile, sha256Hex } from '@/lib/hedera/hfs';
import { submitMessage } from '@/lib/hedera/hcs';
import { getOperator } from '@/lib/hedera/client';
import { withSchema } from '@/lib/validator/withSchema';
import { ensureIdempotent } from '@/lib/validator/idempotency';
import anchorDocumentSchema from '@/lib/validator/schemas/anchor_document.schema.json';



async function anchorDocumentHandler(req: NextRequest, res: any, body: any): Promise<Response> {
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

      // If bundleContentBase64 present → decode, compute SHA256, verify equals digestHex, then createOrAppendFile
      if (bundleContentBase64) {
        const { client } = getOperator();
        const contentBytes = Buffer.from(bundleContentBase64, 'base64');
        
        // Verify digest matches
        const computedDigest = sha256Hex(new Uint8Array(contentBytes));
        if (computedDigest !== digestHex) {
          return NextResponse.json(
            { error: 'digest_mismatch', expected: digestHex, computed: computedDigest },
            { status: 422 }
          );
        }
        
        const { fileId } = await createOrAppendFile(new Uint8Array(contentBytes), client);
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

export const POST = withSchema(anchorDocumentSchema, anchorDocumentHandler);