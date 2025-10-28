import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[INVESTOR] GET /api/investor/[id] - Fetching investor data');
  
  try {
    // Require authentication and check for appropriate role
    const user = await requireUser(request);
    
    // Check if user has INVESTOR role or is admin, or is the investor themselves
    if (user.role?.name !== 'INVESTOR' && user.role?.name !== 'ADMIN' && user.id !== params.id) {
      console.log('[INVESTOR] Access denied for user:', user.id, 'requesting investor:', params.id);
      throw new AuthorizationError('Insufficient permissions');
    }
    
    const investorId = params.id;

    // Get investor data
    const investor = await prisma.user.findUnique({
      where: { 
        id: investorId
      },
      select: {
        id: true,
        name: true,
        hederaAccountId: true,
        createdAt: true,
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
                memberships: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!investor) {
      console.log('[INVESTOR] Investor not found:', investorId);
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    // Calculate portfolio statistics based on shareBps
    const totalShareBps = investor.memberships.reduce(
      (sum: number, membership: any) => sum + (membership.shareBps || 0),
      0
    );

    const activeInvestments = investor.memberships.filter(
      (membership: any) => membership.well.status === 'ACTIVE'
    ).length;

    // Get payouts for investor's wells
    const payouts = await prisma.payout.findMany({
      where: {
        settlement: {
          well: {
            memberships: {
              some: {
                userId: investorId
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
      }
    });

    // Calculate investor's share of each payout
    const investorPayouts = await Promise.all(
      payouts.map(async (payout) => {
        const wellMembership = await prisma.wellMembership.findFirst({
          where: {
            userId: investorId,
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
          ? ((wellMembership.shareBps || 0) / totalWellShares._sum.shareBps)
          : 0;

        const userPayoutAmount = payout.amount * userShare;

        return {
          id: payout.id,
          amount: userPayoutAmount,
          originalAmount: payout.amount,
          userShare: userShare * 100,
          assetType: payout.assetType,
          status: payout.status,
          wellCode: payout.settlement.well.code,
          wellName: payout.settlement.well.name,
          settlementId: payout.settlement.id,
          createdAt: payout.createdAt,
          txId: payout.txId
        };
      })
    );

    const validPayouts = investorPayouts.filter(payout => payout !== null);
    
    const totalEarnings = validPayouts
      .filter(payout => payout.status === 'COMPLETED')
      .reduce((sum, payout) => sum + payout.amount, 0);

    const pendingPayouts = validPayouts
      .filter(payout => payout.status === 'PENDING')
      .reduce((sum, payout) => sum + payout.amount, 0);

    // Format investment portfolio
    const investments = investor.memberships.map((membership: any) => {
      const well = membership.well;
      const totalWellShares = well.memberships.reduce(
        (sum: number, m: any) => sum + (m.shareBps || 0), 
        0
      );
      const ownershipPercentage = totalWellShares > 0 
        ? ((membership.shareBps || 0) / totalWellShares) * 100 
        : 0;

      return {
        id: membership.id,
        wellId: well.id,
        wellCode: well.code,
        wellName: well.name,
        location: well.location,
        coordinates: well.coordinates,
        shareBps: membership.shareBps,
        ownershipPercentage,
        investmentDate: membership.createdAt,
        wellStatus: 'ACTIVE', // Default status since not in schema
        totalWellShares,
        investorCount: well.memberships.length,
        waterQuality: well.waterQuality[0] ? {
          ph: well.waterQuality[0].ph,
          tds: well.waterQuality[0].tds,
          turbidity: well.waterQuality[0].turbidity,
          testDate: well.waterQuality[0].testDate,
          status: getWaterQualityStatus(well.waterQuality[0])
        } : null,
        recentEvents: well.events.map((event: any) => ({
          id: event.id,
          type: event.type,
          timestamp: event.consensusTime,
          txId: event.txId
        })),
        performance: {
          totalPayouts: validPayouts
            .filter(p => p.wellCode === well.code && p.status === 'COMPLETED')
            .reduce((sum, p) => sum + p.amount, 0),
          roi: (membership.shareBps || 0) > 0 
            ? (validPayouts
                .filter(p => p.wellCode === well.code && p.status === 'COMPLETED')
                .reduce((sum, p) => sum + p.amount, 0) / (membership.shareBps || 1)) * 100
            : 0
        }
      };
    });

    const investorData = {
      id: investor.id,
      name: investor.name,
      hederaAccountId: investor.hederaAccountId,
      createdAt: investor.createdAt,
      portfolio: {
        totalShareBps,
        activeInvestments,
        totalWells: investor.memberships.length,
        totalEarnings,
        pendingPayouts,
        roi: totalShareBps > 0 ? (totalEarnings / totalShareBps) * 100 : 0
      },
      investments,
      payouts: validPayouts.slice(0, 20), // Latest 20 payouts
      monthlyEarnings: getMonthlyEarnings(validPayouts)
    };

    console.log('[INVESTOR] Investor data fetched successfully:', investorId);
    return NextResponse.json(investorData);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    console.error('[INVESTOR] Error fetching investor data:', error);
    return NextResponse.json({ error: 'Failed to fetch investor data' }, { status: 500 });
  }
}

function getWaterQualityStatus(waterQuality: any): string {
  const { ph, tds, turbidity } = waterQuality;
  
  const phGood = ph >= 6.5 && ph <= 8.5;
  const tdsGood = tds <= 1000;
  const turbidityGood = turbidity <= 5;
  
  if (phGood && tdsGood && turbidityGood) {
    return 'Excellent';
  } else if ((phGood && tdsGood) || (phGood && turbidityGood) || (tdsGood && turbidityGood)) {
    return 'Good';
  } else {
    return 'Needs Treatment';
  }
}

function getMonthlyEarnings(payouts: any[]) {
  const monthlyData: { [key: string]: number } = {};
  
  payouts
    .filter(payout => payout.status === 'COMPLETED')
    .forEach(payout => {
      const month = new Date(payout.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + payout.amount;
    });

  return Object.entries(monthlyData)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
}