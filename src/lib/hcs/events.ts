import { prisma } from "@/lib/prisma";

export async function createHcsEvent({
  wellId,
  type,
  payloadJson
}: {
  wellId: string;
  type: string;
  payloadJson: string;
}) {
  // For now, we'll create a mock HCS event
  // In a real implementation, this would interact with Hedera Consensus Service
  
  const hcsEvent = await prisma.hcsEvent.create({
    data: {
      well: {
        connect: {
          id: wellId
        }
      },
      type,
      payloadJson,
      sequenceNumber: BigInt(Math.floor(Math.random() * 1000000)),
      consensusTime: new Date(),
      hash: generateMockHash(),
      messageId: generateMockMessageId()
    }
  });

  return hcsEvent;
}

function generateMockHash(): string {
  return Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateMockMessageId(): string {
  // Generate a mock message ID in format: 0.0.XXXXXX-XXXXXXXXXX-XXXXXXXXXX
  const topicId = Math.floor(Math.random() * 999999);
  const timestamp = Math.floor(Math.random() * 9999999999);
  const sequence = Math.floor(Math.random() * 9999999999);
  return `0.0.${topicId}-${timestamp}-${sequence}`;
}

export async function getHcsEvents({
  wellId,
  type,
  limit = 10,
  offset = 0
}: {
  wellId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (wellId) where.wellId = wellId;
  if (type) where.type = type;

  const [events, total] = await Promise.all([
    prisma.hcsEvent.findMany({
      where,
      include: {
        well: {
          include: {
            operator: true
          }
        }
      },
      orderBy: { consensusTime: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.hcsEvent.count({ where })
  ]);

  return {
    events,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
}