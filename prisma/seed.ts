import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

// Read real testnet IDs from environment for consistency with Hedera config
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID || '0.0.6919015';
const HTS_TOKEN_ID = process.env.HTS_TOKEN_ID || '0.0.6919016';
const OPERATOR_ACCOUNT = process.env.HEDERA_ACCOUNT_ID || '0.0.6502425';

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data in correct order to avoid foreign key constraints
  await prisma.payout.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.waterQuality.deleteMany();
  await prisma.document.deleteMany();
  await prisma.anchor.deleteMany();
  await prisma.hcsEvent.deleteMany();
  await prisma.token.deleteMany();
  await prisma.wellMembership.deleteMany();
  await prisma.well.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.idempotency.deleteMany();

  // Create Roles
  const investorRole = await prisma.role.create({
    data: {
      name: 'INVESTOR',
    },
  });

  const operatorRole = await prisma.role.create({
    data: {
      name: 'OPERATOR',
    },
  });

  const agentRole = await prisma.role.create({
    data: {
      name: 'AGENT',
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
    },
  });

  // Create demo users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const operatorUser = await prisma.user.create({
    data: {
      email: 'operator@waternity.com',
      name: 'John Operator',
      hashedPassword,
      salt,
      hederaAccountId: OPERATOR_ACCOUNT,
      roleId: operatorRole.id,
    },
  });

  const investorUser1 = await prisma.user.create({
    data: {
      email: 'investor1@waternity.com',
      name: 'Alice Investor',
      hashedPassword,
      salt,
      hederaAccountId: '0.0.6502426', // Realistic testnet account ID
      roleId: investorRole.id,
    },
  });

  const investorUser2 = await prisma.user.create({
    data: {
      email: 'investor2@waternity.com',
      name: 'Bob Investor',
      hashedPassword,
      salt,
      hederaAccountId: '0.0.6502427', // Realistic testnet account ID
      roleId: investorRole.id,
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      email: 'agent@waternity.com',
      name: 'Sarah Agent',
      hashedPassword,
      salt,
      hederaAccountId: '0.0.6502428', // Realistic testnet account ID
      roleId: agentRole.id,
    },
  });

  // Create demo Wells with real Hedera testnet integration
  const demoWell = await prisma.well.create({
    data: {
      code: 'WTR-001',
      name: 'Lagos Community Water Well',
      location: 'Lagos, Nigeria',
      topicId: HCS_TOPIC_ID,
      tokenId: HTS_TOKEN_ID,
      operatorUserId: operatorUser.id,
    },
  });

  // Create additional wells for testing
  const kanoWell = await prisma.well.create({
    data: {
      code: 'WTR-002',
      name: 'Kano Agricultural Water Well',
      location: 'Kano, Nigeria',
      topicId: HCS_TOPIC_ID,
      tokenId: HTS_TOKEN_ID,
      operatorUserId: operatorUser.id,
    },
  });

  const abujWell = await prisma.well.create({
    data: {
      code: 'WTR-003',
      name: 'Abuja Urban Water Well',
      location: 'Abuja, Nigeria',
      topicId: HCS_TOPIC_ID,
      tokenId: HTS_TOKEN_ID,
      operatorUserId: operatorUser.id,
    },
  });

  // Create demo Well Memberships for Lagos Well
  await prisma.wellMembership.createMany({
    data: [
      {
        userId: operatorUser.id,
        wellId: demoWell.id,
        roleName: 'OPERATOR',
        shareBps: 1000, // 10%
      },
      {
        userId: investorUser1.id,
        wellId: demoWell.id,
        roleName: 'INVESTOR',
        shareBps: 4000, // 40%
      },
      {
        userId: investorUser2.id,
        wellId: demoWell.id,
        roleName: 'INVESTOR',
        shareBps: 3000, // 30%
      },
      {
        userId: agentUser.id,
        wellId: demoWell.id,
        roleName: 'AGENT',
        shareBps: 500, // 5%
      },
    ],
  });

  // Create memberships for Kano Well
  await prisma.wellMembership.createMany({
    data: [
      {
        userId: operatorUser.id,
        wellId: kanoWell.id,
        roleName: 'OPERATOR',
        shareBps: 1500, // 15%
      },
      {
        userId: investorUser1.id,
        wellId: kanoWell.id,
        roleName: 'INVESTOR',
        shareBps: 5000, // 50%
      },
      {
        userId: agentUser.id,
        wellId: kanoWell.id,
        roleName: 'AGENT',
        shareBps: 1000, // 10%
      },
    ],
  });

  // Create memberships for Abuja Well (available for new investments)
  await prisma.wellMembership.createMany({
    data: [
      {
        userId: operatorUser.id,
        wellId: abujWell.id,
        roleName: 'OPERATOR',
        shareBps: 2000, // 20%
      },
      {
        userId: agentUser.id,
        wellId: abujWell.id,
        roleName: 'AGENT',
        shareBps: 800, // 8%
      },
    ],
  });

  // Create demo Token
  await prisma.token.create({
    data: {
      wellId: demoWell.id,
      tokenId: HTS_TOKEN_ID,
      type: 'HTS_FT',
      treasuryAccount: OPERATOR_ACCOUNT,
      decimals: 2,
    },
  });

  // Create a demo Settlement with payouts
  const settlement = await prisma.settlement.create({
    data: {
      wellId: demoWell.id,
      periodStart: new Date('2025-09-01T00:00:00.000Z'),
      periodEnd: new Date('2025-09-30T23:59:59.999Z'),
      kwhTotal: 120_000, // as proxy for water pumping energy
      grossRevenue: 5000, // USD-equivalent for demo
      status: 'DRAFT',
    },
  });

  await prisma.payout.createMany({
    data: [
      {
        settlementId: settlement.id,
        recipientAccount: operatorUser.hederaAccountId!,
        assetType: 'HBAR',
        amount: 500, // 10% of revenue
        status: 'PENDING',
      },
      {
        settlementId: settlement.id,
        recipientAccount: investorUser1.hederaAccountId!,
        assetType: 'HTS_FT',
        tokenId: HTS_TOKEN_ID,
        amount: 2000, // 40%
        status: 'PENDING',
      },
      {
        settlementId: settlement.id,
        recipientAccount: investorUser2.hederaAccountId!,
        assetType: 'HTS_FT',
        tokenId: HTS_TOKEN_ID,
        amount: 1500, // 30%
        status: 'PENDING',
      },
    ],
  });

  // Add a sample water quality record
  await prisma.waterQuality.create({
    data: {
      wellId: demoWell.id,
      ph: 7.2,
      turbidity: 1.5,
      tds: 250,
      temperature: 24.0,
      chlorine: 0.4,
      bacteria: 0.0,
      compliance: true,
      testedBy: 'State Health Lab',
      certificationBody: 'NAFDAC',
    },
  });

  console.log(`Seeding finished.`);
}

export async function runSeed() {
  return main();
}

// Run only when invoked via CLI (e.g., npm run db:seed)
if (process.env.RUN_SEED_CLI === 'true') {
  runSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}