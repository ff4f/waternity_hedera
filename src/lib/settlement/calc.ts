/**
 * Settlement calculation utilities with fixed 6-decimal rounding and drift correction
 * Ensures sum of all payouts equals grossRevenue exactly
 */

export interface SettlementRecipient {
  id: string;
  percentage: number; // 0-100
  address: string;
  name?: string;
}

export interface SettlementCalculation {
  grossRevenue: number;
  recipients: SettlementRecipient[];
  payouts: {
    recipientId: string;
    address: string;
    amount: number; // Fixed to 6 decimals
    percentage: number;
  }[];
  totalPayout: number;
  drift: number; // Should be 0 after correction
}

/**
 * Round to exactly 6 decimal places
 */
export function roundTo6Decimals(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

/**
 * Calculate settlement payouts with drift correction
 * Ensures the sum of all payouts equals grossRevenue exactly
 */
export function calculateSettlement(
  grossRevenue: number,
  recipients: SettlementRecipient[]
): SettlementCalculation {
  // Validate inputs
  if (grossRevenue <= 0) {
    throw new Error('Gross revenue must be positive');
  }

  if (!recipients.length) {
    throw new Error('At least one recipient is required');
  }

  const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.000001) {
    throw new Error(`Total percentage must equal 100%, got ${totalPercentage}%`);
  }

  // Calculate initial payouts with 6-decimal rounding
  const payouts = recipients.map((recipient) => {
    const rawAmount = (grossRevenue * recipient.percentage) / 100;
    const roundedAmount = roundTo6Decimals(rawAmount);
    
    return {
      recipientId: recipient.id,
      address: recipient.address,
      amount: roundedAmount,
      percentage: recipient.percentage,
    };
  });

  // Calculate drift (difference between sum and grossRevenue)
  const totalPayout = payouts.reduce((sum, p) => sum + p.amount, 0);
  const drift = roundTo6Decimals(grossRevenue - totalPayout);

  // Apply drift correction to the last recipient
  if (Math.abs(drift) > 0.000001) {
    const lastPayout = payouts[payouts.length - 1];
    lastPayout.amount = roundTo6Decimals(lastPayout.amount + drift);
  }

  // Recalculate final totals
  const finalTotalPayout = payouts.reduce((sum, p) => sum + p.amount, 0);
  const finalDrift = roundTo6Decimals(grossRevenue - finalTotalPayout);

  return {
    grossRevenue: roundTo6Decimals(grossRevenue),
    recipients,
    payouts,
    totalPayout: finalTotalPayout,
    drift: finalDrift,
  };
}

/**
 * Validate settlement calculation
 * Ensures mathematical correctness
 */
export function validateSettlement(calculation: SettlementCalculation): boolean {
  // Check if sum equals gross revenue (within floating point precision)
  const sumCheck = Math.abs(calculation.totalPayout - calculation.grossRevenue) < 0.000001;
  
  // Check if drift is effectively zero
  const driftCheck = Math.abs(calculation.drift) < 0.000001;
  
  // Check if all amounts are properly rounded to 6 decimals
  const roundingCheck = calculation.payouts.every(p => {
    const rounded = roundTo6Decimals(p.amount);
    return Math.abs(p.amount - rounded) < 0.0000001;
  });

  return sumCheck && driftCheck && roundingCheck;
}

/**
 * Convert amount to smallest unit (tinybars for HBAR, or token units)
 * HBAR: 1 HBAR = 100,000,000 tinybars
 * Tokens: depends on decimals (usually 6-18)
 */
export function toSmallestUnit(amount: number, decimals: number = 8): bigint {
  const multiplier = Math.pow(10, decimals);
  const smallestUnit = Math.round(amount * multiplier);
  return BigInt(smallestUnit);
}

/**
 * Convert from smallest unit back to decimal amount
 */
export function fromSmallestUnit(amount: bigint, decimals: number = 8): number {
  const divisor = Math.pow(10, decimals);
  return Number(amount) / divisor;
}

/**
 * Format amount for display with proper decimal places
 */
export function formatAmount(amount: number, decimals: number = 6): string {
  return amount.toFixed(decimals);
}

/**
 * Calculate platform fee from gross revenue
 */
export function calculatePlatformFee(
  grossRevenue: number,
  feePercentage: number = 2.5
): number {
  const fee = (grossRevenue * feePercentage) / 100;
  return roundTo6Decimals(fee);
}

/**
 * Calculate net revenue after platform fee
 */
export function calculateNetRevenue(
  grossRevenue: number,
  feePercentage: number = 2.5
): number {
  const fee = calculatePlatformFee(grossRevenue, feePercentage);
  return roundTo6Decimals(grossRevenue - fee);
}