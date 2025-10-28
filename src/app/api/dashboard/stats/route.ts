import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';
import { logger } from '@/lib/log';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  let user: any = null;
  try {
    // Dashboard stats are public for GET requests (as configured in middleware)
    // Only require authentication for admin-specific features if needed
    try {
      user = await requireUser(request);
      logger.info('Dashboard stats requested by authenticated user', {
        userId: user.sub,
        role: user.role
      });
    } catch (error) {
      // Allow public access - no authentication required for dashboard stats
      user = { sub: 'public', role: 'PUBLIC' };
      logger.info('Dashboard stats requested by public user');
    }
    
    logger.info('Dashboard stats requested', {
      userId: user.sub,
      role: user.role
    });

    // Get counts
    const [wellsCount, activeWellsCount, usersCount, payoutsCount] = await Promise.all([
      prisma.well.count(),
      prisma.well.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.payout.count()
    ]);

    // Get settlement counts by status
    const settlementsByStatus = await prisma.settlement.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const settlementByStatus = settlementsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get last 10 HCS events ordered by consensusTime desc, sequenceNumber desc
    const recentEvents = await prisma.hcsEvent.findMany({
      take: 10,
      orderBy: [
        { consensusTime: 'desc' },
        { sequenceNumber: 'desc' }
      ],
      include: {
        well: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    const formattedEvents = recentEvents.map(event => ({
      id: event.id,
      type: event.type,
      title: getEventTitle(event.type),
      description: getEventDescription(event.type, event.well?.code || '', event.payloadJson),
      timestamp: event.consensusTime?.toISOString() || new Date().toISOString(),
      wellCode: event.well?.code,
      txId: event.messageId
    }));

    const response = {
      totalWells: wellsCount,
      activeWells: activeWellsCount,
      totalRevenue: 0, // TODO: Calculate from settlements
      totalPayouts: payoutsCount,
      recentEvents: formattedEvents
    };

    logger.info('Dashboard stats retrieved successfully', {
      userId: user.sub,
      totalWells: wellsCount,
      activeWells: activeWellsCount,
      totalPayouts: payoutsCount,
      eventsCount: formattedEvents.length
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching dashboard stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user?.sub
    });
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

function getEventTitle(type: string): string {
  switch (type) {
    case 'WELL_CREATED':
      return 'New Well Created';
    case 'MILESTONE_VERIFIED':
      return 'Milestone Verified';
    case 'PAYOUT_EXECUTED':
      return 'Payout Executed';
    default:
      return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

function getEventDescription(type: string, wellCode: string, payloadJson: string): string {
  try {
    const payload = JSON.parse(payloadJson);
    switch (type) {
      case 'WELL_CREATED':
        return `Well ${wellCode} has been successfully created and registered on Hedera`;
      case 'MILESTONE_VERIFIED':
        return `Production milestone for Well ${wellCode} has been verified by agent`;
      case 'PAYOUT_EXECUTED':
        return `Payout of ${payload.amount} ${payload.currency || 'HBAR'} distributed to investors`;
      default:
        return payload.details || `${type} event for Well ${wellCode}`;
    }
  } catch {
    return `${type} event for Well ${wellCode}`;
  }
}