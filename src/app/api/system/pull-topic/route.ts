import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma';
import { fetchTopicMessages, timestampToDate } from "@/lib/hedera/mirror";
import { getCursor, saveCursor } from "@/lib/mirror/cursors";
import { TopicId } from "@hashgraph/sdk";
import { createHash } from "crypto";
import { requireUser, assertRole, AuthenticationError, AuthorizationError, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/auth/roles";
import { rateLimit, createUserKey, createIpKey } from "@/lib/http/rateLimit";
import { logger } from "@/lib/log";
import { isValidTopicId } from "@/lib/hedera/ids";

// Helper function to get client IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return '127.0.0.1';
}

const PullTopicSchema = z.object({
  wellId: z.string().min(1, "Well ID is required"),
  fromTs: z.string().optional(),
  batchSize: z.number().min(1).max(1000).optional().default(100),
  maxRetries: z.number().min(0).max(10).optional().default(3),
});

// Backoff configuration
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;

// Utility functions
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoffDelay(attempt: number): number {
  const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
  return delay + Math.random() * 1000; // Add jitter
}

// Validate topic exists on Mirror Node
async function validateTopicExists(topicId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${topicId}`);
    return response.ok;
  } catch (error) {
    logger.warn('Failed to validate topic existence', { topicId, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

export async function POST(request: NextRequest) {
  let user = null;
  
  try {
    // Authentication and authorization
    user = await requireUser(request);
    assertRole(user, "ADMIN", "OPERATOR");

    // Rate limiting
    const clientIp = getClientIp(request);
    const userKey = createUserKey(user.id, 'pull-topic');
    const ipKey = createIpKey(clientIp, 'pull-topic');

    try {
      await rateLimit({
        key: userKey,
        limit: 10,
        windowMs: 60000 // 1 minute
      });
      await rateLimit({
        key: ipKey,
        limit: 20,
        windowMs: 60000 // 1 minute
      });
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED') {
        logger.warn('Rate limit exceeded', { 
          userId: user.id, 
          clientIp,
          retryAfter: error.details.retryAfter
        });
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            retryAfter: error.details.retryAfter
          }),
          { 
            status: 429, 
            headers: { 
              "Content-Type": "application/json",
              "Retry-After": error.details.retryAfter.toString()
            } 
          }
        );
      }
      throw error;
    }

    logger.info('Pull topic request started', { userId: user.id, clientIp });

    // Parse and validate request body
    const body = await request.json();
    const { wellId, fromTs, batchSize, maxRetries } = PullTopicSchema.parse(body);

    logger.info('Request validated', { wellId, batchSize, maxRetries });

    // Fetch well details
    const well = await prisma.well.findUnique({
      where: { id: wellId },
      select: { id: true, topicId: true, name: true },
    });

    if (!well) {
      logger.warn('Well not found', { wellId, userId: user.id });
      return new Response(
        JSON.stringify({ error: "Well not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { topicId } = well;

    // Validate topic ID format
    if (!isValidTopicId(topicId)) {
      logger.error('Invalid topic ID format', { topicId, wellId });
      return new Response(
        JSON.stringify({ error: "Invalid topic ID format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate topic exists on Mirror Node
    const topicExists = await validateTopicExists(topicId);
    if (!topicExists) {
      logger.error('Topic not found on Mirror Node', { topicId, wellId });
      return new Response(
        JSON.stringify({ error: "Topic not found on Mirror Node" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine starting timestamp
    let currentTimestamp = fromTs;
    if (!currentTimestamp) {
      const cursor = await getCursor(topicId);
      currentTimestamp = cursor || "0.0";
    }

    logger.info('Starting HCS mirror ingestion', { 
      wellId, 
      topicId, 
      startTimestamp: currentTimestamp,
      batchSize,
      maxRetries
    });

    // Batch processing with backoff
    let hasMore = true;
    let batchNumber = 0;
    let totalFetched = 0;
    let processedCount = 0;
    let lastConsensusTimestamp: string | null = null;

    while (hasMore && batchNumber < 10) { // Limit to 10 batches per request
      batchNumber++;
      let batchSuccess = false;

      logger.info('Processing batch', { batchNumber, currentTimestamp });

      // Retry logic with exponential backoff
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Fetch messages from Mirror Node
          const result = await fetchTopicMessages({
            topicId,
            fromTs: currentTimestamp,
            limit: batchSize,
          });

          totalFetched += result.messages.length;
          
          if (result.messages.length === 0) {
            logger.info('No more messages to process', { topicId, currentTimestamp });
            hasMore = false;
            batchSuccess = true;
            break;
          }

          // Process and upsert each message in the batch
          let batchProcessedCount = 0;
          for (const message of result.messages) {
            try {
              // Generate consistent message ID
              const messageId = message.messageId || `${topicId}-${message.sequenceNumber}`;

              // Convert consensus timestamp to Date
              const consensusTime = timestampToDate(message.consensusTimestamp);

              // Determine event type from payload
              const eventType = (message.payload && typeof message.payload === 'object' && 'type' in message.payload) 
                ? (message.payload as any).type 
                : "UNKNOWN";

              // Idempotent upsert HcsEvent record
              await prisma.hcsEvent.upsert({
                where: { messageId },
                update: {
                  consensusTime,
                  sequenceNumber: BigInt(message.sequenceNumber),
                  hash: message.runningHash,
                  payloadJson: JSON.stringify(message.payload),
                  wellId,
                },
                create: {
                  messageId,
                  type: eventType,
                  consensusTime,
                  sequenceNumber: BigInt(message.sequenceNumber),
                  hash: message.runningHash,
                  payloadJson: JSON.stringify(message.payload),
                  wellId,
                },
              });

              batchProcessedCount++;
              lastConsensusTimestamp = message.consensusTimestamp;
            } catch (error) {
              logger.error('Failed to upsert message', { 
                messageId: message.messageId, 
                topicId, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
              // Continue processing other messages in the batch
            }
          }

          processedCount += batchProcessedCount;
          
          // Always advance cursor after successful batch processing
          if (lastConsensusTimestamp) {
            await saveCursor(topicId, lastConsensusTimestamp);
            logger.info('Cursor advanced', { 
              topicId, 
              lastConsensusTimestamp, 
              batchProcessed: batchProcessedCount 
            });
          }

          // Update current timestamp for next batch
          if (result.messages.length > 0) {
            currentTimestamp = result.messages[result.messages.length - 1].consensusTimestamp;
          }

          // Check if there are more messages
          hasMore = !!result.links.next && result.messages.length === batchSize;
          batchSuccess = true;
          break; // Exit retry loop on success

        } catch (error) {
          const isLastAttempt = attempt === maxRetries;
          logger.warn('Batch processing failed', { 
            batchNumber, 
            attempt: attempt + 1, 
            maxRetries: maxRetries + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
            willRetry: !isLastAttempt
          });

          if (isLastAttempt) {
            logger.error('Batch processing failed after all retries', { 
              batchNumber, 
              topicId, 
              maxRetries: maxRetries + 1 
            });
            // Don't throw here, just mark batch as failed and continue
            break;
          } else {
            // Wait before retrying with exponential backoff
            const delay = calculateBackoffDelay(attempt);
            logger.info('Waiting before retry', { delay, attempt: attempt + 1 });
            await sleep(delay);
          }
        }
      }

      if (!batchSuccess) {
        logger.warn('Batch failed after all retries, stopping processing', { 
          batchNumber, 
          topicId 
        });
        break;
      }
    }

    logger.info('HCS mirror ingestion completed', {
      wellId,
      topicId,
      totalFetched,
      processedCount,
      batchesProcessed: batchNumber,
      lastConsensusTimestamp,
      userId: user.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        wellId,
        topicId,
        totalFetched,
        processed: processedCount,
        batchesProcessed: batchNumber,
        lastConsensusTimestamp,
        hasMore: hasMore && batchNumber >= 10, // Indicate if more batches are available
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error('Pull topic error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user?.id 
    });

    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}