import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            well: {
              include: {
                waterQuality: {
                  orderBy: {
                    createdAt: 'desc'
                  },
                  take: 1
                },
                events: {
                  orderBy: {
                    consensusTime: 'desc'
                  },
                  take: 3
                },
                memberships: true
              }
            }
          }
        },
        wells: {
          include: {
            memberships: true,
            events: {
              orderBy: {
                consensusTime: 'desc'
              },
              take: 5
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate investment statistics
    const totalInvestment = user.memberships.reduce(
      (sum, membership) => sum + (membership.shareBps / 100), // Convert basis points to percentage
      0
    );

    const activeInvestments = user.memberships.length; // All memberships are considered active

    // Get recent payouts for this user
    const recentPayouts = await prisma.payout.findMany({
      where: {
        settlement: {
          well: {
            memberships: {
              some: {
                userId: userId
              }
            }
          }
        }
      },
      include: {
        settlement: {
          include: {
            well: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Calculate user's share of payouts
    const userPayouts = await Promise.all(
      recentPayouts.map(async (payout) => {
        const wellMembership = await prisma.wellMembership.findFirst({
          where: {
            userId: userId,
            wellId: payout.settlement.wellId
          }
        });

        if (!wellMembership) return null;

        const totalWellShares = await prisma.wellMembership.aggregate({
          where: {
            wellId: payout.settlement.wellId
          },
          _sum: {
            shareBps: true
          }
        });

        const userShare = totalWellShares._sum.shareBps 
          ? (wellMembership.shareBps / totalWellShares._sum.shareBps)
          : 0;

        const userPayoutAmount = payout.amount * userShare;

        return {
          id: payout.id,
          amount: userPayoutAmount,
          assetType: payout.assetType,
          status: payout.status,
          wellCode: payout.settlement.well.code,
          wellName: payout.settlement.well.name,
          createdAt: payout.createdAt,
          txId: payout.txId
        };
      })
    );

    const validUserPayouts = userPayouts.filter(payout => payout !== null);
    const totalEarnings = validUserPayouts
      .filter(payout => payout.status === 'COMPLETED')
      .reduce((sum, payout) => sum + payout.amount, 0);

    // Format investments
    const investments = user.memberships.map(membership => ({
      id: membership.id,
      wellId: membership.well.id,
      wellCode: membership.well.code,
      wellName: membership.well.name,
      location: membership.well.location,
      sharePercentage: membership.shareBps / 100, // Convert basis points to percentage
      investmentDate: membership.createdAt,
      status: 'ACTIVE', // Default status since not in schema
      waterQuality: membership.well.waterQuality[0] ? {
        ph: membership.well.waterQuality[0].ph,
        tds: membership.well.waterQuality[0].tds,
        turbidity: membership.well.waterQuality[0].turbidity,
        testDate: membership.well.waterQuality[0].testDate
      } : null,
      recentEvents: membership.well.events.map(event => ({
        id: event.id,
        type: event.type,
        timestamp: event.consensusTime
      }))
    }));

    const userData = {
      id: user.id,
      name: user.name,
      accountId: user.accountId || '0.0.unknown',
      role: user.role || 'USER',
      createdAt: user.createdAt,
      stats: {
        totalInvestment,
        activeInvestments,
        totalEarnings,
        totalWells: user.memberships.length
      },
      investments,
      recentPayouts: validUserPayouts,
      operatedWells: user.role === 'OPERATOR' ? user.wells.map(well => ({
        id: well.id,
        code: well.code,
        name: well.name,
        location: well.location,
        status: 'ACTIVE', // Default status since not in schema
        investorCount: well.memberships.length,
        totalShares: well.memberships.reduce((sum, m) => sum + m.shareBps, 0),
        recentEvents: well.events.map(event => ({
          id: event.id,
          type: event.type,
          timestamp: event.consensusTime
        }))
      })) : []
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}