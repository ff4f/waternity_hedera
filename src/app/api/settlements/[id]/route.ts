import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db/prisma';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '../../../../lib/auth/roles';
import { logger } from '../../../../lib/log';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate and authorize
    const user = await requireUser(request);
    assertRole(user, 'OPERATOR', 'ADMIN', 'INVESTOR');
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    // Define what to include based on available relations
    const includeConfig = {
      well: {
        select: {
          id: true,
          name: true,
          location: true,
          latitude: true,
          longitude: true,
          status: true,
          topicId: true,
          tokenId: true,
          createdAt: true
        }
      },
      payouts: {
        select: {
          id: true,
          recipientAccount: true,
          assetType: true,
          amount: true,
          tokenId: true,
          txId: true,
          status: true,
          createdAt: true
        }
      }
    };

    // Fetch settlement with related data
    const settlement = await prisma.settlement.findUnique({
      where: { id },
      include: includeConfig
    });

    if (!settlement) {
      return NextResponse.json(
        { error: 'Settlement not found' },
        { status: 404 }
      );
    }

    // Role-based access control for investors
    if (user.role?.name === 'INVESTOR') {
      // Get user's Hedera account ID from user record
      const userRecord = await prisma.user.findUnique({
        where: { id: user.id },
        select: { hederaAccountId: true }
      });
      
      if (!userRecord?.hederaAccountId) {
        return NextResponse.json(
          { error: 'User Hedera account not found' },
          { status: 403 }
        );
      }
      
      // Check if user has access through well membership or payouts
      const wellMembership = await prisma.wellMembership.findFirst({
        where: {
          userId: user.id,
          wellId: settlement.wellId
        }
      });
      
      const hasPayoutAccess = settlement.payouts.some(
        payout => payout.recipientAccount === userRecord.hederaAccountId
      );
      
      if (!wellMembership && !hasPayoutAccess) {
        return NextResponse.json(
          { error: 'Access denied. You can only view settlements for wells you are involved with.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: settlement
    });

  } catch (error) {
    logger.error('Settlement fetch by ID failed', {
      settlementId: params.id,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Failed to fetch settlement', details: errorMessage },
      { status: 500 }
    );
  }
}