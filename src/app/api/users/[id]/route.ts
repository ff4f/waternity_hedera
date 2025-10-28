import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getUserFromRequest } from '@/lib/auth/session';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[USERS] GET /api/users/[id] - Fetching user profile');
  
  try {
    // Require authentication for user data access
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = params.id;

    // Check if user can access this profile (self or admin)
    if (authUser.id !== userId && authUser.role?.name !== 'ADMIN') {
      console.log('[USERS] Access denied for user:', authUser.id, 'requesting profile:', userId);
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
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
      console.log('[USERS] User not found:', userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate investment statistics
    const totalInvestment = user.memberships.reduce(
      (sum, membership) => sum + ((membership.shareBps || 0) / 100), // Convert basis points to percentage
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
          ? ((wellMembership.shareBps || 0) / totalWellShares._sum.shareBps)
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
      sharePercentage: (membership.shareBps || 0) / 100, // Convert basis points to percentage
      investmentDate: new Date(), // Default date since createdAt not available on membership
      status: 'ACTIVE', // Default status since not in schema
      waterQuality: membership.well.waterQuality[0] ? {
        ph: membership.well.waterQuality[0].ph,
        tds: membership.well.waterQuality[0].tds,
        turbidity: membership.well.waterQuality[0].turbidity,
        testDate: membership.well.waterQuality[0].createdAt
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
      accountId: user.hederaAccountId || '0.0.unknown',
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
      operatedWells: user.role?.name === 'OPERATOR' ? user.wells.map(well => ({
        id: well.id,
        code: well.code,
        name: well.name,
        location: well.location,
        status: 'ACTIVE', // Default status since not in schema
        investorCount: well.memberships.length,
        totalShares: well.memberships.reduce((sum, m) => sum + (m.shareBps || 0), 0),
        recentEvents: well.events.map(event => ({
          id: event.id,
          type: event.type,
          timestamp: event.consensusTime
        }))
      })) : []
    };

    console.log('[USERS] User profile fetched successfully:', userId);
    return NextResponse.json(userData);
  } catch (error) {
    console.error('[USERS] Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[USERS] PUT /api/users/[id] - Updating user profile');
  
  try {
    // Require authentication for user data updates
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = params.id;

    // Check if user can update this profile (self or admin)
    if (authUser.id !== userId && authUser.role?.name !== 'ADMIN') {
      console.log('[USERS] Update access denied for user:', authUser.id, 'requesting profile:', userId);
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if email is already taken by another user
    if (email !== authUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ error: 'Email is already taken' }, { status: 400 });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email
      },
      include: {
        role: true
      }
    });

    console.log('[USERS] User profile updated successfully:', userId);
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      hederaAccountId: updatedUser.hederaAccountId,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('[USERS] Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}