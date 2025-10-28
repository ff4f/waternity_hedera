/**
 * Well Investment API Route
 * POST /api/wells/[id]/invest
 * 
 * Handles investment transactions for wells with real-time Hedera integration
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publishEvent } from "@/lib/hedera/hcs";
import { transferInvestment } from "@/lib/hedera/hts";
import { AccountId } from "@hashgraph/sdk";
import { getUserFromRequest } from "@/lib/auth/session";

// Investment request schema - removed private key requirement
const investmentSchema = z.object({
  amount: z.number().positive("Investment amount must be positive"),
  assetType: z.enum(["HBAR", "TOKEN"], {
    required_error: "Asset type is required",
  }),
});

type InvestmentRequest = z.infer<typeof investmentSchema>;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wellId = params.id;
    
    // Check authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has connected wallet
    if (!user.hederaAccountId) {
      return NextResponse.json(
        { error: "Wallet connection required. Please connect your wallet first." },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = investmentSchema.parse(body);

    // Validate Hedera Account ID format
    try {
      AccountId.fromString(user.hederaAccountId);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid Hedera Account ID format" },
        { status: 400 }
      );
    }

    // Get well with token information
    const well = await prisma.well.findUnique({
      where: { id: wellId },
      include: {
        tokens: true,
        memberships: true,
      },
    });

    if (!well) {
      return NextResponse.json({ error: 'Well not found' }, { status: 404 });
    }

    // Get treasury account from well's token
    const wellToken = well.tokens.find(token => token.type === 'HTS_FT');
    if (!wellToken) {
      return NextResponse.json(
        { error: 'Well token not found' },
        { status: 400 }
      );
    }

    const treasuryAccount = wellToken.treasuryAccount;

    // Check if investor already has membership
    const existingMembership = well.memberships.find(
      membership => membership.userId === user.id
    );
    if (existingMembership) {
      return NextResponse.json(
        { error: "Investor already has membership in this well" },
        { status: 400 }
      );
    }

    // Calculate share allocation (simplified - in production this would be more complex)
    const totalInvestment = 1000000; // Example total investment capacity
    const shareBps = Math.floor((validatedData.amount / totalInvestment) * 10000); // Basis points

    try {
      // Note: In a real implementation, the transfer would be handled by the wallet
      // For now, we'll create the membership record and publish the event
      // The actual transfer will be handled by the frontend wallet integration

      // Create well membership record
      const membership = await prisma.wellMembership.create({
        data: {
          userId: user.id,
          wellId,
          roleName: 'INVESTOR',
          shareBps,
        },
      });

      // Publish investment event to HCS
      if (well.topicId) {
        try {
          await publishEvent({
            topicId: well.topicId,
            messageJson: {
              type: "INVESTMENT_MADE",
              wellId,
              investorAccountId: user.hederaAccountId,
              amount: validatedData.amount,
              assetType: validatedData.assetType,
              shareBps,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (hcsError) {
          console.warn("Failed to publish investment event to HCS:", hcsError);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          membershipId: membership.id,
          shareBps,
          investmentAmount: validatedData.amount,
          assetType: validatedData.assetType,
        },
      });

    } catch (error) {
      console.error("Investment error:", error);
      return NextResponse.json(
        { error: "Investment failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error("Investment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}