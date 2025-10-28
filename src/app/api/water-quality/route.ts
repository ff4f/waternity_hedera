import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchemaAndIdempotency } from "@/lib/validator/withSchemaAndIdempotency";
import meterReadingSchema from "@/lib/validator/schemas/meter_reading.schema.json";
import { createHcsEvent } from "@/lib/hcs/events";
import { notFound, serverError } from '@/lib/http/errors';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';

async function createWaterQualityRecord({
  wellId,
  ph,
  turbidity,
  tds,
  temperature,
  chlorine,
  bacteria,
  compliance,
  testedBy,
  certificationBody
}: {
  wellId: string;
  ph: number;
  turbidity: number;
  tds: number;
  temperature: number;
  chlorine: number;
  bacteria: number;
  compliance: boolean;
  testedBy: string;
  certificationBody?: string;
}) {
  // Create HCS event for water quality record
  const eventPayload = {
    type: 'WATER_QUALITY_TEST',
    wellId,
    data: {
      ph,
      turbidity,
      tds,
      temperature,
      chlorine,
      bacteria,
      compliance,
      testedBy,
      certificationBody,
      timestamp: new Date().toISOString()
    }
  };

  const hcsEvent = await createHcsEvent({
    wellId,
    type: 'WATER_QUALITY_TEST',
    payloadJson: JSON.stringify(eventPayload)
  });

  // Store in database
  const qualityRecord = await prisma.waterQuality.create({
    data: {
      wellId,
      ph,
      turbidity,
      tds,
      temperature,
      chlorine,
      bacteria,
      compliance,
      testedBy,
      certificationBody,
      hcsEventId: hcsEvent.id
    }
  });

  return {
    qualityRecord,
    hcsEvent
  };
}

async function createWaterQualityHandler(req: NextRequest, res: any, body: any): Promise<Response> {
  console.log('[WATER-QUALITY] POST /api/water-quality - Recording water quality data');
  
  // Require OPERATOR or ADMIN role
  const user = await requireUser(req);
  assertRole(user, 'OPERATOR', 'ADMIN');
  
  const {
    wellId,
    ph,
    turbidity,
    tds,
    temperature,
    chlorine,
    bacteria,
    compliance,
    testedBy,
    certificationBody
  } = body;
  
  // Use idempotency key from withSchema validation
  const idempotencyKey = (req as any).idempotencyKey;
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Idempotency-Key header is required" }, { status: 400 });
  }

  // Find the well
  const well = await prisma.well.findUnique({
    where: { id: wellId }
  });

  if (!well) {
    console.log('[WATER-QUALITY] Well not found:', wellId);
    return NextResponse.json({ error: "Well not found" }, { status: 404 });
  }

  console.log('[WATER-QUALITY] Creating water quality record for well:', wellId);
  const result = await createWaterQualityRecord({
    wellId,
    ph,
    turbidity,
    tds,
    temperature,
    chlorine,
    bacteria,
    compliance,
    testedBy,
    certificationBody
  });

  console.log('[WATER-QUALITY] Data recorded successfully - hcsEventId:', result.hcsEvent.id);

  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}

async function getWaterQualityHandler(req: NextRequest, context?: any) {
  const url = new URL(req.url);
  const wellId = url.searchParams.get('wellId');
  const compliance = url.searchParams.get('compliance');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const where: any = {};
  if (wellId) where.wellId = wellId;
  if (compliance !== null) where.compliance = compliance === 'true';

  const [qualityRecords, total] = await Promise.all([
    prisma.waterQuality.findMany({
      where,
      include: {
        well: {
          include: {
            operator: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.waterQuality.count({ where })
  ]);

  return NextResponse.json({
    qualityRecords,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

// Handle different HTTP methods
export async function POST(req: NextRequest) {
  try {
    return withSchemaAndIdempotency(meterReadingSchema, createWaterQualityHandler)(req);
  } catch (error) {
    console.error('[WATER-QUALITY] Error in POST handler:', error);
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    return NextResponse.json({ error: 'Failed to record water quality data' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return getWaterQualityHandler(req);
}