import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { pullAndUpsert, saveCursor } from "@/lib/mirror/cursors";
import { z } from "zod";

const PullTopicSchema = z.object({
  wellId: z.string().optional(),
  topicId: z.string().optional(),
  fromTs: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wellId, topicId, fromTs } = PullTopicSchema.parse(body);

    // Validate that either wellId or topicId is provided
    if (!wellId && !topicId) {
      return NextResponse.json(
        { error: "Either wellId or topicId is required" },
        { status: 400 }
      );
    }

    let targetTopicId: string;
    let targetWellId: string | null = null;

    if (wellId) {
      // Get topic ID from well
      const well = await prisma.well.findUnique({
        where: { id: wellId },
        select: { id: true, topicId: true, name: true }
      });

      if (!well || !well.topicId) {
        return NextResponse.json(
          { error: "Well not found or has no topic ID" },
          { status: 404 }
        );
      }

      targetTopicId = well.topicId;
      targetWellId = well.id;
    } else {
      // Use provided topic ID directly
      targetTopicId = topicId!;
    }

    // If fromTs is provided, override the cursor
    if (fromTs) {
      await saveCursor(targetTopicId, fromTs);
    }

    // Run pullAndUpsert to fetch and store messages
    const result = await pullAndUpsert({ topicId: targetTopicId, wellId: targetWellId || undefined });

    return NextResponse.json({
      success: true,
      data: {
        topicId: targetTopicId,
        wellId: targetWellId,
        pulled: result.pulled,
        lastConsensusTime: result.lastConsensusTime
      }
    });

  } catch (error) {
    console.error('Failed to pull topic messages:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}