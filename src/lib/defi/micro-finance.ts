import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  TokenId,
  Hbar
} from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { HederaCoreService } from '@/lib/hedera/hedera-core';

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  REPAID = 'REPAID',
  DEFAULTED = 'DEFAULTED',
  LIQUIDATED = 'LIQUIDATED'
}

export enum CollateralType {
  WATER_RIGHTS = 'WATER_RIGHTS',
  TOKENIZED_ASSET = 'TOKENIZED_ASSET',
  REPUTATION = 'REPUTATION',
  GROUP_GUARANTEE = 'GROUP_GUARANTEE'
}

export interface LoanApplication {
  borrower: string;
  amount: number;
  purpose: string;
  duration: number; // in days
  interestRate: number;
  collateralType: CollateralType;
  collateralValue: number;
  collateralTokenId?: string;
  groupMembers?: string[]; // for group lending
  businessPlan?: string;
  creditScore?: number;
}

export interface Loan {
  id: string;
  borrower: string;
  lender?: string;
  amount: number;
  interestRate: number;
  duration: number;
  collateralType: CollateralType;
  collateralValue: number;
  collateralTokenId?: string;
  status: LoanStatus;
  disbursedAt?: Date;
  dueDate?: Date;
  repaidAmount: number;
  remainingAmount: number;
  groupMembers?: string[];
  creditScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LendingPool {
  id: string;
  name: string;
  description: string;
  totalCapacity: number;
  availableLiquidity: number;
  totalLoaned: number;
  averageAPY: number;
  minimumLoanAmount: number;
  maximumLoanAmount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tokenId: string;
  createdAt: Date;
}

export interface LiquidityProvider {
  id: string;
  provider: string;
  poolId: string;
  amount: number;
  shares: number;
  earnedInterest: number;
  depositedAt: Date;
}

export interface RepaymentSchedule {
  loanId: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  isPaid: boolean;
  paidAt?: Date;
}

export interface CreditScore {
  userId: string;
  score: number;
  factors: {
    paymentHistory: number;
    creditUtilization: number;
    lengthOfHistory: number;
    typesOfCredit: number;
    newCredit: number;
  };
  lastUpdated: Date;
}

export class MicroFinanceService {
  private client: Client;
  private operatorKey: PrivateKey;
  private operatorId: AccountId;
  private hederaCore: HederaCoreService;

  constructor() {
    this.client = Client.forTestnet();
    this.operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY || '');
    this.operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID || '');
    this.client.setOperator(this.operatorId, this.operatorKey);
    this.hederaCore = new HederaCoreService({
      operatorId: process.env.HEDERA_OPERATOR_ID || '',
      operatorKey: process.env.HEDERA_OPERATOR_KEY || '',
      network: 'testnet'
    });
  }

  // ===== LENDING POOL MANAGEMENT =====

  /**
   * Create a new lending pool
   */
  async createLendingPool(
    name: string,
    description: string,
    totalCapacity: number,
    minimumLoanAmount: number,
    maximumLoanAmount: number,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): Promise<LendingPool> {
    try {
      // Create pool token
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(`${name} Pool Token`)
        .setTokenSymbol(`LP${name.substring(0, 3).toUpperCase()}`)
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Infinite)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(this.operatorKey)
        .setSupplyKey(this.operatorKey)
        .setTokenMemo(`Lending Pool: ${name}`)
        .setMaxTransactionFee(new Hbar(30));

      const tokenCreateResponse = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;

      if (!tokenId) {
        throw new Error('Failed to create pool token');
      }

      // Store in database
      const pool = await prisma.lendingPool.create({
        data: {
          name,
          description,
          totalCapacity,
          availableLiquidity: 0,
          totalLoaned: 0,
          averageAPY: this.calculateAPYByRisk(riskLevel),
          minimumLoanAmount,
          maximumLoanAmount,
          riskLevel,
          tokenId: tokenId.toString()
        }
      });

      // Submit to HCS
      await this.hederaCore.submitMessage(
        'lending_pool_creation',
        JSON.stringify({
          action: 'create_pool',
          poolId: pool.id,
          name,
          tokenId: tokenId.toString(),
          totalCapacity,
          riskLevel,
          timestamp: new Date().toISOString()
        })
      );

      return {
        id: pool.id,
        name: pool.name,
        description: pool.description,
        totalCapacity: pool.totalCapacity,
        availableLiquidity: pool.availableLiquidity,
        totalLoaned: pool.totalLoaned,
        averageAPY: pool.averageAPY,
        minimumLoanAmount: pool.minimumLoanAmount,
        maximumLoanAmount: pool.maximumLoanAmount,
        riskLevel: pool.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        tokenId: pool.tokenId,
        createdAt: pool.createdAt
      };
    } catch (error) {
      console.error('Error creating lending pool:', error);
      throw new Error('Failed to create lending pool');
    }
  }

  /**
   * Add liquidity to a lending pool
   */
  async addLiquidity(
    poolId: string,
    provider: string,
    amount: number
  ): Promise<string> {
    try {
      const pool = await prisma.lendingPool.findUnique({
        where: { id: poolId }
      });

      if (!pool) {
        throw new Error('Pool not found');
      }

      // Calculate shares (simplified)
      const totalShares = await this.getTotalPoolShares(poolId);
      const shares = totalShares === 0 ? amount : (amount * totalShares) / pool.availableLiquidity;

      // Mint pool tokens to provider
      const mintTx = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(pool.tokenId))
        .setAmount(Math.floor(shares))
        .setMaxTransactionFee(new Hbar(10));

      const mintResponse = await mintTx.execute(this.client);
      await mintResponse.getReceipt(this.client);

      // Transfer pool tokens to provider
      const transferTx = new TransferTransaction()
        .addTokenTransfer(TokenId.fromString(pool.tokenId), this.operatorId, -Math.floor(shares))
        .addTokenTransfer(TokenId.fromString(pool.tokenId), AccountId.fromString(provider), Math.floor(shares))
        .setMaxTransactionFee(new Hbar(2));

      const transferResponse = await transferTx.execute(this.client);
      await transferResponse.getReceipt(this.client);

      // Update database
      await prisma.liquidityProvider.create({
        data: {
          provider,
          poolId,
          amount,
          shares: Math.floor(shares),
          earnedInterest: 0
        }
      });

      await prisma.lendingPool.update({
        where: { id: poolId },
        data: {
          availableLiquidity: {
            increment: amount
          }
        }
      });

      // Submit to HCS
      await this.hederaCore.submitMessage(
        'liquidity_provision',
        JSON.stringify({
          action: 'add_liquidity',
          poolId,
          provider,
          amount,
          shares: Math.floor(shares),
          transactionId: transferResponse.transactionId.toString(),
          timestamp: new Date().toISOString()
        })
      );

      return transferResponse.transactionId.toString();
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw new Error('Failed to add liquidity');
    }
  }

  // ===== LOAN MANAGEMENT =====

  /**
   * Apply for a loan
   */
  async applyForLoan(application: LoanApplication): Promise<string> {
    try {
      // Calculate credit score if not provided
      const creditScore = application.creditScore || await this.calculateCreditScore(application.borrower);
      
      // Validate collateral
      await this.validateCollateral(application.collateralType, application.collateralValue, application.collateralTokenId);

      // Create loan application
      const loan = await prisma.loan.create({
        data: {
          borrower: application.borrower,
          amount: application.amount,
          purpose: application.purpose,
          duration: application.duration,
          interestRate: application.interestRate,
          collateralType: application.collateralType,
          collateralValue: application.collateralValue,
          collateralTokenId: application.collateralTokenId,
          status: LoanStatus.PENDING,
          repaidAmount: 0,
          remainingAmount: application.amount,
          groupMembers: application.groupMembers ? JSON.stringify(application.groupMembers) : null,
          creditScore,
          businessPlan: application.businessPlan
        }
      });

      // Auto-approve based on criteria
      if (await this.shouldAutoApprove(loan.id, creditScore, application)) {
        await this.approveLoan(loan.id);
      }

      // Submit to HCS
      await this.hederaCore.submitMessage(
        'loan_application',
        JSON.stringify({
          action: 'apply_loan',
          loanId: loan.id,
          borrower: application.borrower,
          amount: application.amount,
          collateralType: application.collateralType,
          creditScore,
          timestamp: new Date().toISOString()
        })
      );

      return loan.id;
    } catch (error) {
      console.error('Error applying for loan:', error);
      throw new Error('Failed to apply for loan');
    }
  }

  /**
   * Approve a loan
   */
  async approveLoan(loanId: string): Promise<string> {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId }
      });

      if (!loan || loan.status !== LoanStatus.PENDING) {
        throw new Error('Invalid loan or loan not pending');
      }

      // Find suitable lending pool
      const pool = await this.findSuitablePool(loan.amount, loan.collateralType as CollateralType);
      
      if (!pool) {
        throw new Error('No suitable lending pool found');
      }

      // Disburse loan
      const disburseTx = new TransferTransaction()
        .addHbarTransfer(this.operatorId, new Hbar(-loan.amount))
        .addHbarTransfer(AccountId.fromString(loan.borrower), new Hbar(loan.amount))
        .setTransactionMemo(`Loan disbursement: ${loanId}`)
        .setMaxTransactionFee(new Hbar(1));

      const disburseResponse = await disburseTx.execute(this.client);
      await disburseResponse.getReceipt(this.client);

      // Update loan status
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + loan.duration);

      await prisma.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.ACTIVE,
          disbursedAt: new Date(),
          dueDate,
          lender: pool.id
        }
      });

      // Update pool liquidity
      await prisma.lendingPool.update({
        where: { id: pool.id },
        data: {
          availableLiquidity: {
            decrement: loan.amount
          },
          totalLoaned: {
            increment: loan.amount
          }
        }
      });

      // Create repayment schedule
      await this.createRepaymentSchedule(loanId, loan.amount, loan.interestRate, loan.duration);

      // Submit to HCS
      await this.hederaCore.submitMessage(
        'loan_approval',
        JSON.stringify({
          action: 'approve_loan',
          loanId,
          borrower: loan.borrower,
          amount: loan.amount,
          poolId: pool.id,
          transactionId: disburseResponse.transactionId.toString(),
          timestamp: new Date().toISOString()
        })
      );

      return disburseResponse.transactionId.toString();
    } catch (error) {
      console.error('Error approving loan:', error);
      throw new Error('Failed to approve loan');
    }
  }

  /**
   * Make loan repayment
   */
  async makeRepayment(
    loanId: string,
    amount: number,
    installmentNumber?: number
  ): Promise<string> {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: loanId }
      });

      if (!loan || loan.status !== LoanStatus.ACTIVE) {
        throw new Error('Invalid loan or loan not active');
      }

      // Process payment
      const paymentTx = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(loan.borrower), new Hbar(-amount))
        .addHbarTransfer(this.operatorId, new Hbar(amount))
        .setTransactionMemo(`Loan repayment: ${loanId}`)
        .setMaxTransactionFee(new Hbar(1));

      const paymentResponse = await paymentTx.execute(this.client);
      await paymentResponse.getReceipt(this.client);

      // Update loan
      const newRepaidAmount = loan.repaidAmount + amount;
      const newRemainingAmount = Math.max(0, loan.remainingAmount - amount);
      const isFullyRepaid = newRemainingAmount === 0;

      await prisma.loan.update({
        where: { id: loanId },
        data: {
          repaidAmount: newRepaidAmount,
          remainingAmount: newRemainingAmount,
          status: isFullyRepaid ? LoanStatus.REPAID : LoanStatus.ACTIVE
        }
      });

      // Update repayment schedule if specific installment
      if (installmentNumber) {
        await prisma.repaymentSchedule.updateMany({
          where: {
            loanId,
            installmentNumber
          },
          data: {
            paidAmount: amount,
            isPaid: true,
            paidAt: new Date()
          }
        });
      }

      // Update credit score
      await this.updateCreditScore(loan.borrower, 'PAYMENT_MADE', amount);

      // Distribute interest to liquidity providers
      if (loan.lender) {
        await this.distributeInterestToProviders(loan.lender, amount * 0.1); // 10% of payment as interest
      }

      // Submit to HCS
      await this.hederaCore.submitMessage(
        'loan_repayment',
        JSON.stringify({
          action: 'make_repayment',
          loanId,
          borrower: loan.borrower,
          amount,
          remainingAmount: newRemainingAmount,
          isFullyRepaid,
          transactionId: paymentResponse.transactionId.toString(),
          timestamp: new Date().toISOString()
        })
      );

      return paymentResponse.transactionId.toString();
    } catch (error) {
      console.error('Error making repayment:', error);
      throw new Error('Failed to make repayment');
    }
  }

  // ===== CREDIT SCORING =====

  /**
   * Calculate credit score for a user
   */
  async calculateCreditScore(userId: string): Promise<number> {
    try {
      // Get user's loan history
      const loans = await prisma.loan.findMany({
        where: { borrower: userId },
        include: {
          repayments: true
        }
      });

      // Convert database results to our Loan interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convertedLoans: Loan[] = loans.map((loan: any) => ({
        id: loan.id,
        borrower: loan.borrower,
        lender: loan.lender || undefined,
        amount: loan.amount,
        interestRate: loan.interestRate,
        duration: loan.duration,
        collateralType: loan.collateralType as CollateralType,
        collateralValue: loan.collateralValue,
        collateralTokenId: loan.collateralTokenId || undefined,
        status: loan.status as LoanStatus,
        disbursedAt: loan.disbursedAt || undefined,
        dueDate: loan.dueDate || undefined,
        repaidAmount: loan.repaidAmount,
        remainingAmount: loan.remainingAmount,
        groupMembers: loan.groupMembers || undefined,
        creditScore: loan.creditScore,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      }));

      // Calculate factors
      const paymentHistory = this.calculatePaymentHistory(convertedLoans);
      const creditUtilization = this.calculateCreditUtilization(convertedLoans);
      const lengthOfHistory = this.calculateLengthOfHistory(convertedLoans);
      const typesOfCredit = this.calculateTypesOfCredit(convertedLoans);
      const newCredit = this.calculateNewCredit(convertedLoans);

      // Weighted score calculation
      const score = Math.round(
        paymentHistory * 0.35 +
        creditUtilization * 0.30 +
        lengthOfHistory * 0.15 +
        typesOfCredit * 0.10 +
        newCredit * 0.10
      );

      // Store/update credit score
      await prisma.creditScore.upsert({
        where: { userId },
        update: {
          score,
          paymentHistory,
          creditUtilization,
          lengthOfHistory,
          typesOfCredit,
          newCredit,
          lastUpdated: new Date()
        },
        create: {
          userId,
          score,
          paymentHistory,
          creditUtilization,
          lengthOfHistory,
          typesOfCredit,
          newCredit,
          lastUpdated: new Date()
        }
      });

      return score;
    } catch (error) {
      console.error('Error calculating credit score:', error);
      return 300; // Default low score
    }
  }

  // ===== HELPER METHODS =====

  private calculateAPYByRisk(riskLevel: string): number {
    const rates = {
      LOW: 8.5,
      MEDIUM: 12.0,
      HIGH: 18.0
    };
    return rates[riskLevel as keyof typeof rates] || 12.0;
  }

  private async getTotalPoolShares(poolId: string): Promise<number> {
    const result = await prisma.liquidityProvider.aggregate({
      where: { poolId },
      _sum: { shares: true }
    });
    return result._sum.shares || 0;
  }

  private async validateCollateral(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: CollateralType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tokenId?: string
  ): Promise<boolean> {
    // Implement collateral validation logic
    return true;
  }

  private async shouldAutoApprove(
    loanId: string,
    creditScore: number,
    application: LoanApplication
  ): Promise<boolean> {
    // Auto-approve criteria
    return creditScore >= 650 && application.amount <= 1000;
  }

  private async findSuitablePool(amount: number, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collateralType: CollateralType): Promise<LendingPool | null> {
    const pool = await prisma.lendingPool.findFirst({
      where: {
        availableLiquidity: {
          gte: amount
        },
        minimumLoanAmount: {
          lte: amount
        },
        maximumLoanAmount: {
          gte: amount
        }
      }
    });

    if (!pool) return null;

    return {
      ...pool,
      riskLevel: pool.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH'
    };
  }

  private async createRepaymentSchedule(
    loanId: string,
    amount: number,
    interestRate: number,
    duration: number
  ): Promise<void> {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = Math.ceil(duration / 30); // Monthly payments
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    for (let i = 1; i <= numberOfPayments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      const interestAmount = amount * monthlyRate;
      const principalAmount = monthlyPayment - interestAmount;

      await prisma.repaymentSchedule.create({
        data: {
          loanId,
          installmentNumber: i,
          dueDate,
          principalAmount,
          interestAmount,
          totalAmount: monthlyPayment,
          paidAmount: 0,
          isPaid: false
        }
      });
    }
  }

  private async updateCreditScore(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    action: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    amount: number
  ): Promise<void> {
    // Implement credit score update logic
    await this.calculateCreditScore(userId);
  }

  private async distributeInterestToProviders(
    poolId: string,
    interestAmount: number
  ): Promise<void> {
    const providers = await prisma.liquidityProvider.findMany({
      where: { poolId }
    });

    const totalShares = providers.reduce((sum: number, p: LiquidityProvider) => sum + p.shares, 0);

    for (const provider of providers) {
      const providerShare = (provider.shares / totalShares) * interestAmount;
      
      await prisma.liquidityProvider.update({
        where: { id: provider.id },
        data: {
          earnedInterest: {
            increment: providerShare
          }
        }
      });
    }
  }

  private calculatePaymentHistory(loans: Loan[]): number {
    if (loans.length === 0) return 300;
    
    const onTimePayments = loans.filter((loan: Loan) => 
      loan.status === LoanStatus.REPAID || loan.repaidAmount > 0
    ).length;
    
    return Math.min(850, 300 + (onTimePayments / loans.length) * 550);
  }

  private calculateCreditUtilization(loans: Loan[]): number {
    const activeLoans = loans.filter((loan: Loan) => loan.status === LoanStatus.ACTIVE);
    if (activeLoans.length === 0) return 850;
    
    const totalBorrowed = activeLoans.reduce((sum: number, loan: Loan) => sum + loan.amount, 0);
    const utilization = totalBorrowed / 10000; // Assume 10k credit limit
    
    return Math.max(300, 850 - (utilization * 550));
  }

  private calculateLengthOfHistory(loans: Loan[]): number {
    if (loans.length === 0) return 300;
    
    const oldestLoan = loans.reduce((oldest: Loan, loan: Loan) => 
      loan.createdAt < oldest.createdAt ? loan : oldest
    );
    
    const monthsOfHistory = Math.floor(
      (Date.now() - oldestLoan.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    return Math.min(850, 300 + Math.min(monthsOfHistory * 10, 550));
  }

  private calculateTypesOfCredit(loans: Loan[]): number {
    const types = new Set(loans.map((loan: Loan) => loan.collateralType));
    return Math.min(850, 300 + types.size * 100);
  }

  private calculateNewCredit(loans: Loan[]): number {
    const recentLoans = loans.filter((loan: Loan) => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return loan.createdAt > sixMonthsAgo;
    });
    
    return Math.max(300, 850 - recentLoans.length * 50);
  }

  /**
   * Close client connection
   */
  close(): void {
    this.client.close();
  }
}

// Create singleton instance
export const microFinance = new MicroFinanceService();