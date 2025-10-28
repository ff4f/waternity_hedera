import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';
import { requireUser, assertRole, AuthenticationError, AuthorizationError, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/auth/roles";
import { rateLimit, createUserKey } from "@/lib/http/rateLimit";
import { logger } from "@/lib/log";
import { isValidTopicId } from "@/lib/hedera/ids";

// Request validation schema
const RebuildTopicRequestSchema = z.object({
  topicId: z.string().min(1, "Topic ID is required"),
  fromTimestamp: z.string().optional().describe("Optional timestamp to start from (ISO string or Hedera timestamp)"),
  reason: z.string().min(1, "Reason for rebuild is required").max(500, "Reason must be under 500 characters")
});

type RebuildTopicRequest = z.infer<typeof RebuildTopicRequestSchema>;

/**
 * POST /api/system/rebuild-topic
 * 
 * ADMIN-only endpoint to reset MirrorCursor for a topic, allowing complete rebuild.
 * This is a destructive operation that should only be used when:
 * - Topic data is corrupted or inconsistent
 * - Need to reprocess messages from a specific point
 * - Recovering from system errors
 * 
 * Security: ADMIN role required + rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication & Authorization
    const user = await requireUser(request);
    assertRole(user, 'ADMIN');

    // Rate limiting - very restrictive for this destructive operation
    await rateLimit({
      key: createUserKey(user.id, 'rebuild-topic'),
      limit: 2, // Only 2 rebuilds per hour per admin
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    // Parse and validate request
    const body = await request.json();
    const validatedData = RebuildTopicRequestSchema.parse(body);
    const { topicId, fromTimestamp, reason } = validatedData;

    // Validate topic ID format
    if (!isValidTopicId(topicId)) {
      return Response.json(
        { error: "Invalid topic ID format" },
        { status: 400 }
      );
    }

    logger.warn('Topic rebuild initiated', {
      topicId,
      fromTimestamp,
      reason,
      adminUserId: user.id,
      adminEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Start transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check if cursor exists
      const existingCursor = await tx.mirrorCursor.findUnique({
        where: { topicId }
      });

      let resetTimestamp: string;
      
      if (fromTimestamp) {
        // Validate and use provided timestamp
        if (fromTimestamp.includes('T')) {
          // ISO string - convert to Hedera timestamp
          const date = new Date(fromTimestamp);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid ISO timestamp format");
          }
          resetTimestamp = `${Math.floor(date.getTime() / 1000)}.${String(date.getMilliseconds()).padStart(3, '0')}000000`;
        } else {
          // Assume Hedera timestamp format
          resetTimestamp = fromTimestamp;
        }
      } else {
        // Reset to beginning of time (earliest possible Hedera timestamp)
        resetTimestamp = "0.000000000";
      }

      // Delete all existing HCS events for this topic (optional - for complete rebuild)
      // Note: HcsEvent doesn't have topicId field, so we'll skip deletion for now
      // This could be enhanced by adding topicId to HcsEvent schema or using wellId
      const deletedEvents = { count: 0 };

      // Reset or create cursor
      const updatedCursor = await tx.mirrorCursor.upsert({
        where: { topicId },
        update: {
          lastConsensusTime: resetTimestamp,
          updatedAt: new Date()
        },
        create: {
          topicId,
          lastConsensusTime: resetTimestamp
        }
      });

      // Log the rebuild action (using console for now since AuditLog doesn't exist)
      logger.info('Topic rebuild action logged', {
        action: 'TOPIC_REBUILD',
        userId: user.id,
        topicId,
        fromTimestamp: resetTimestamp,
        reason,
        deletedEventsCount: deletedEvents.count,
        previousCursor: existingCursor ? {
          lastConsensusTime: existingCursor.lastConsensusTime
        } : null
      });

      return {
        topicId,
        resetTimestamp,
        deletedEventsCount: deletedEvents.count,
        cursorReset: true,
        previousCursor: existingCursor
      };
    });

    logger.info('Topic rebuild completed successfully', {
      topicId,
      resetTimestamp: result.resetTimestamp,
      deletedEventsCount: result.deletedEventsCount,
      adminUserId: user.id
    });

    return Response.json({
      success: true,
      message: "Topic rebuild initiated successfully",
      data: result
    }, { status: 200 });

  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }

    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return Response.json(
        { error: "Rate limit exceeded. Topic rebuilds are limited to 2 per hour." },
        { status: 429 }
      );
    }

    logger.error('Topic rebuild failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return Response.json(
      { error: "Internal server error during topic rebuild" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/system/rebuild-topic
 * 
 * Get current cursor states (ADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication & Authorization
    const user = await requireUser(request);
    assertRole(user, 'ADMIN');

    // Get current cursor states
    const cursors = await prisma.mirrorCursor.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return Response.json({
      success: true,
      data: {
        currentCursors: cursors,
        message: "Current mirror cursor states"
      }
    }, { status: 200 });

  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }

    logger.error('Failed to get rebuild status', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}