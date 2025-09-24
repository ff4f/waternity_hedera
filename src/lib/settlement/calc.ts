import { prisma } from "@/lib/prisma";

interface PayoutRecipient {
  account: string;
  amount: number;
}

interface CalcPayoutsParams {
  wellId: string;
  grossRevenue: number;
}

/**
 * Calculates deterministic share distribution for a well settlement
 * Reads WellMembership.shareBps (sum ≤ 10000) and maps to {account, amount}
 * Rounds with fixed 6 decimals and enforces sum equals grossRevenue
 * Last recipient absorbs any rounding difference
 */
export async function calcPayouts({
  wellId,
  grossRevenue,
}: CalcPayoutsParams): Promise<PayoutRecipient[]> {
  // Validate input
  if (grossRevenue < 0) {
    throw new Error("Gross revenue cannot be negative");
  }

  if (grossRevenue === 0) {
    return [];
  }

  // Get all well memberships with share allocations
  const memberships = await prisma.wellMembership.findMany({
    where: {
      wellId,
      shareBps: {
        not: null,
        gt: 0,
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      id: 'asc', // Deterministic ordering
    },
  });

  if (memberships.length === 0) {
    throw new Error("No valid memberships found for well");
  }

  // Validate total share doesn't exceed 10000 bps (100%)
  const totalShareBps = memberships.reduce(
    (sum, membership) => sum + (membership.shareBps || 0),
    0
  );

  if (totalShareBps > 10000) {
    throw new Error(
      `Total share allocation (${totalShareBps} bps) exceeds 100% (10000 bps)`
    );
  }

  if (totalShareBps === 0) {
    throw new Error("No valid share allocations found");
  }

  // Calculate payouts with 6 decimal precision
  const recipients: PayoutRecipient[] = [];
  let totalAllocated = 0;

  for (let i = 0; i < memberships.length; i++) {
    const membership = memberships[i];
    const shareBps = membership.shareBps || 0;
    
    // Get account ID from user
    const account = membership.user.accountId;
    if (!account) {
      throw new Error(
        `User ${membership.user.id} does not have a Hedera account ID`
      );
    }

    let amount: number;
    
    // For the last recipient, absorb any rounding difference
    if (i === memberships.length - 1) {
      amount = grossRevenue - totalAllocated;
    } else {
      // Calculate proportional amount
      const rawAmount = (grossRevenue * shareBps) / totalShareBps;
      // Round to 6 decimal places
      amount = Math.round(rawAmount * 1000000) / 1000000;
      totalAllocated += amount;
    }

    // Ensure amount is not negative (edge case protection)
    if (amount < 0) {
      amount = 0;
    }

    // Only include recipients with positive amounts
    if (amount > 0) {
      recipients.push({
        account,
        amount,
      });
    }
  }

  // Final validation: ensure total equals gross revenue (within floating point precision)
  const totalPaid = recipients.reduce((sum, r) => sum + r.amount, 0);
  const difference = Math.abs(totalPaid - grossRevenue);
  
  // Allow for tiny floating point differences (1 microunit)
  if (difference > 0.000001) {
    throw new Error(
      `Payout calculation error: total (${totalPaid}) does not equal gross revenue (${grossRevenue})`
    );
  }

  return recipients;
}

/**
 * Validates that a well has valid membership allocations
 */
export async function validateWellMemberships(wellId: string): Promise<{
  isValid: boolean;
  totalShareBps: number;
  membershipCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  
  const memberships = await prisma.wellMembership.findMany({
    where: {
      wellId,
      shareBps: {
        not: null,
        gt: 0,
      },
    },
    include: {
      user: true,
    },
  });

  const totalShareBps = memberships.reduce(
    (sum, membership) => sum + (membership.shareBps || 0),
    0
  );

  if (memberships.length === 0) {
    errors.push("No valid memberships found");
  }

  if (totalShareBps > 10000) {
    errors.push(`Total share allocation (${totalShareBps} bps) exceeds 100%`);
  }

  if (totalShareBps === 0) {
    errors.push("No valid share allocations found");
  }

  // Check for users without account IDs
  const usersWithoutAccounts = memberships.filter(
    (m) => !m.user.accountId
  );
  
  if (usersWithoutAccounts.length > 0) {
    errors.push(
      `${usersWithoutAccounts.length} users do not have Hedera account IDs`
    );
  }

  return {
    isValid: errors.length === 0,
    totalShareBps,
    membershipCount: memberships.length,
    errors,
  };
}