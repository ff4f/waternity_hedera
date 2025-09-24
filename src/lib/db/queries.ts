import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export async function insertEventIdempotent(event: Prisma.HcsEventUncheckedCreateInput) {
  return prisma.hcsEvent.upsert({
    where: { messageId: event.messageId },
    update: {},
    create: event,
  });
}

export async function getWellById(id: string) {
  return prisma.well.findUnique({ where: { id } });
}

export async function listWells() {
  return prisma.well.findMany();
}

export async function listEventsForWell(params: {
  wellId: string;
  type?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const { wellId, type, from, to, limit } = params;
  return prisma.hcsEvent.findMany({
    where: {
      wellId,
      type,
      consensusTime: {
        gte: from,
        lte: to,
      },
    },
    take: limit,
    orderBy: {
      consensusTime: 'desc',
    },
  });
}

export async function createSettlementRequest(settlement: Prisma.SettlementUncheckedCreateInput) {
  return prisma.settlement.create({ data: settlement });
}

export async function approveSettlement(id: string) {
  return prisma.settlement.update({
    where: { id },
    data: { status: 'APPROVED' },
  });
}

export async function executeSettlementRecord(id: string) {
  return prisma.settlement.update({
    where: { id },
    data: { status: 'EXECUTED' },
  });
}

export async function listPayouts(settlementId: string) {
  return prisma.payout.findMany({ where: { settlementId } });
}

export async function getAuditReport(params: {
  wellId: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  const { wellId, periodStart, periodEnd } = params;
  return prisma.settlement.findMany({
    where: {
      wellId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    include: {
      payouts: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      well: {
        include: {
          events: {
            where: {
              consensusTime: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
            orderBy: {
              consensusTime: 'asc',
            },
          },
          documents: {
            where: {
              createdAt: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
            select: {
              hfsFileId: true,
              type: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: {
      periodStart: 'asc',
    },
  });
}

export async function getWellMetaLinks(wellId: string) {
  const well = await prisma.well.findUnique({
    where: { id: wellId },
    select: {
      topicId: true,
      tokenId: true,
      documents: {
        select: {
          hfsFileId: true,
        },
        where: {
          hfsFileId: {
            not: null,
          },
        },
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!well) {
    return null;
  }

  return {
    hashscan: {
      topic: well.topicId,
      token: well.tokenId || undefined,
      file: well.documents[0]?.hfsFileId || undefined,
    },
    mirror: {
      topic: well.topicId,
    },
  };
}