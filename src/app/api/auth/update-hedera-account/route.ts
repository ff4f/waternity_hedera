/**
 * Update User Hedera Account API Route
 * POST /api/auth/update-hedera-account
 * 
 * Updates the authenticated user's Hedera account ID when they connect their wallet
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AccountId } from "@hashgraph/sdk";

// Request schema
const updateAccountSchema = z.object({
  hederaAccountId: z.string().min(1, "Hedera account ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { hederaAccountId } = updateAccountSchema.parse(body);

    // Validate Hedera Account ID format
    try {
      AccountId.fromString(hederaAccountId);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid Hedera Account ID format" },
        { status: 400 }
      );
    }

    // Check if another user already has this Hedera account
    const existingUser = await prisma.user.findFirst({
      where: {
        hederaAccountId,
        id: { not: user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This Hedera account is already linked to another user" },
        { status: 409 }
      );
    }

    // Update user's Hedera account ID
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { hederaAccountId },
      select: {
        id: true,
        email: true,
        name: true,
        hederaAccountId: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Hedera account linked successfully"
    });

  } catch (error) {
    console.error("Error updating Hedera account:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}