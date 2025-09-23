import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get total counts
    const totalUsers = await prisma.user.count();
    const totalWells = await prisma.well.count();
    const activeWells = await prisma.well.count({
      where: {
        // Assuming wells with recent events are active
        events: {
          some: {
            consensusTime: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    });

    // Get total revenue from settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        status: 'COMPLETED'
      }
    });
    const totalRevenue = settlements.reduce((sum, settlement) => sum + (settlement.grossRevenue || 0), 0);

    // Get total payouts
    const payouts = await prisma.payout.findMany({
      where: {
        status: 'COMPLETED'
      }
    });
    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);

    // Get recent events
    const recentEvents = await prisma.hcsEvent.findMany({
      take: 10,
      orderBy: {
        consensusTime: 'desc'
      },
      include: {
        well: true
      }
    });

    const formattedEvents = recentEvents.map(event => ({
      id: event.id,
      type: event.type,
      title: getEventTitle(event.type),
      description: getEventDescription(event.type, event.well?.code || '', event.payloadJson),
      timestamp: event.consensusTime,
      wellCode: event.well?.code,
      txId: event.txId
    }));

    return NextResponse.json({
      totalWells,
      activeWells,
      totalRevenue,
      totalPayouts,
      recentEvents: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
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