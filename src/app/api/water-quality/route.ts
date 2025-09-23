import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSchema } from "@/lib/validator/withSchema";
import { ensureIdempotent } from "@/lib/validator/idempotency";
import { createHcsEvent } from "@/lib/hcs/events";

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

async function createWaterQualityHandler(req: NextRequest, context?: any) {
  // Use parsed body from withSchema validation
  const body = (req as any).parsedBody;
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
    return NextResponse.json({ error: "Well not found" }, { status: 404 });
  }

  const result = await ensureIdempotent(
    idempotencyKey,
    'water_quality_create',
    async () => {
      return await createWaterQualityRecord({
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
    }
  );

  if (result.isNew) {
    return NextResponse.json(result.result, {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return NextResponse.json({ message: "Water quality record already processed", resultHash: result.resultHash }, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
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
  return withSchema('water_quality_create.schema.json', createWaterQualityHandler)(req);
}

export async function GET(req: NextRequest) {
  return getWaterQualityHandler(req);
}