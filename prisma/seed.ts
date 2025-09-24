import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  await prisma.idempotency.deleteMany();

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const johnOperator = await prisma.user.create({
    data: {
      name: 'John Operator',
      username: 'john.operator',
      password: hashedPassword,
      accountId: '0.0.123456',
      walletEvm: '0x1234567890abcdef1234567890abcdef12345678',
      role: 'OPERATOR',
    },
  });

  const sarahAgent = await prisma.user.create({
    data: {
      name: 'Sarah Agent',
      username: 'sarah.agent',
      password: hashedPassword,
      accountId: '0.0.234567',
      walletEvm: '0x2345678901bcdef12345678901bcdef123456789',
      role: 'AGENT',
    },
  });

  const johnInvestor = await prisma.user.create({
    data: {
      name: 'John Investor',
      username: 'john.investor',
      password: hashedPassword,
      accountId: '0.0.345678',
      walletEvm: '0x3456789012cdef123456789012cdef1234567890',
      role: 'INVESTOR',
    },
  });

  const aliceInvestor = await prisma.user.create({
    data: {
      name: 'Alice Investor',
      username: 'alice.investor',
      password: hashedPassword,
      accountId: '0.0.45678',
      walletEvm: '0x456789013def123456789013def12345678901a',
      role: 'INVESTOR',
    },
  });

  const mikeOperator = await prisma.user.create({
    data: {
      name: 'Mike Operator',
      username: 'mike.operator',
      password: hashedPassword,
      accountId: '0.0.56789',
      walletEvm: '0x56789014ef123456789014ef123456789014ef1',
      role: 'OPERATOR',
    },
  });

  const johnUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      username: 'john.user',
      password: hashedPassword,
      accountId: '0.0.123456',
      walletEvm: '0x6789015f123456789015f123456789015f1234',
      role: 'USER',
    },
  });

  const emmaAgent = await prisma.user.create({
    data: {
      name: 'Emma Wilson',
      username: 'emma.agent',
      password: hashedPassword,
      accountId: '0.0.234567',
      walletEvm: '0x789016f123456789016f123456789016f12345',
      role: 'AGENT',
    },
  });

  const davidInvestor = await prisma.user.create({
    data: {
      name: 'David Chen',
      username: 'david.investor',
      password: hashedPassword,
      accountId: '0.0.345678',
      walletEvm: '0x89017f123456789017f123456789017f123456',
      role: 'INVESTOR',
    },
  });

  const lisaOperator = await prisma.user.create({
    data: {
      name: 'Lisa Rodriguez',
      username: 'lisa.operator',
      password: hashedPassword,
      accountId: '0.0.456789',
      walletEvm: '0x9018f123456789018f123456789018f1234567',
      role: 'OPERATOR',
    },
  });

  const tomInvestor = await prisma.user.create({
    data: {
      name: 'Tom Anderson',
      username: 'tom.investor',
      password: hashedPassword,
      accountId: '0.0.567890',
      walletEvm: '0xa019f123456789019f123456789019f12345678',
      role: 'INVESTOR',
    },
  });

  const mariaUser = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      username: 'maria.user',
      password: hashedPassword,
      accountId: '0.0.678901',
      walletEvm: '0xb01af123456789019f123456789019f123456789',
      role: 'USER',
    },
  });

  const alexAgent = await prisma.user.create({
    data: {
      name: 'Alex Thompson',
      username: 'alex.agent',
      password: hashedPassword,
      accountId: '0.0.789012',
      walletEvm: '0xc01bf123456789019f123456789019f12345678a',
      role: 'AGENT',
    },
  });

  // Additional users for more comprehensive testing
  const sarahOperator = await prisma.user.create({
    data: {
      name: 'Sarah Operator',
      username: 'sarah.operator2',
      password: hashedPassword,
      accountId: '0.0.890123',
      walletEvm: '0xd01cf123456789019f123456789019f12345678b',
      role: 'OPERATOR',
    },
  });

  const jamesInvestor = await prisma.user.create({
    data: {
      name: 'James Investor',
      username: 'james.investor',
      password: hashedPassword,
      accountId: '0.0.901234',
      walletEvm: '0xe01df123456789019f123456789019f12345678c',
      role: 'INVESTOR',
    },
  });

  const rachelUser = await prisma.user.create({
    data: {
      name: 'Rachel User',
      username: 'rachel.user',
      password: hashedPassword,
      accountId: '0.0.012345',
      walletEvm: '0xf01ef123456789019f123456789019f12345678d',
      role: 'USER',
    },
  });

  const kevinAgent = await prisma.user.create({
    data: {
      name: 'Kevin Agent',
      username: 'kevin.agent',
      password: hashedPassword,
      accountId: '0.0.123457',
      walletEvm: '0x101ff123456789019f123456789019f12345678e',
      role: 'AGENT',
    },
  });

  // Create Wells
  const sunriseWell = await prisma.well.create({
    data: {
      code: 'WTR-001',
      name: 'Sunrise Valley Well',
      location: 'Lagos, Nigeria',
      topicId: '0.0.12345',
      tokenId: '0.0.67890',
      operatorUserId: johnOperator.id,
    },
  });

  const greenHillsWell = await prisma.well.create({
    data: {
      code: 'WTR-002',
      name: 'Green Hills Water Source',
      location: 'Abuja, Nigeria',
      topicId: '0.0.23456',
      tokenId: '0.0.78901',
      operatorUserId: johnOperator.id,
    },
  });

  const blueValleyWell = await prisma.well.create({
    data: {
      code: 'WTR-003',
      name: 'Blue Valley Well',
      location: 'Kano, Nigeria',
      topicId: '0.0.34567',
      tokenId: '0.0.89012',
      operatorUserId: mikeOperator.id,
    },
  });

  const crystalSpringsWell = await prisma.well.create({
    data: {
      code: 'WTR-004',
      name: 'Crystal Springs Well',
      location: 'Port Harcourt, Nigeria',
      topicId: '0.0.45678',
      tokenId: '0.0.90123',
      operatorUserId: lisaOperator.id,
    },
  });

  const goldenOaksWell = await prisma.well.create({
    data: {
      code: 'WTR-005',
      name: 'Golden Oaks Water Source',
      location: 'Ibadan, Nigeria',
      topicId: '0.0.56789',
      tokenId: '0.0.01234',
      operatorUserId: johnOperator.id,
    },
  });

  const riverBendWell = await prisma.well.create({
    data: {
      code: 'WTR-006',
      name: 'River Bend Well',
      location: 'Kaduna, Nigeria',
      topicId: '0.0.67890',
      tokenId: '0.0.12345',
      operatorUserId: mikeOperator.id,
    },
  });

  // Additional wells for comprehensive testing
  const mountainViewWell = await prisma.well.create({
    data: {
      code: 'WTR-007',
      name: 'Mountain View Well',
      location: 'Jos, Nigeria',
      topicId: '0.0.78901',
      tokenId: '0.0.23456',
      operatorUserId: sarahOperator.id,
    },
  });

  const desertSpringWell = await prisma.well.create({
    data: {
      code: 'WTR-008',
      name: 'Desert Spring Well',
      location: 'Maiduguri, Nigeria',
      topicId: '0.0.89012',
      tokenId: '0.0.34567',
      operatorUserId: mikeOperator.id,
    },
  });

  const coastalWell = await prisma.well.create({
    data: {
      code: 'WTR-009',
      name: 'Coastal Fresh Well',
      location: 'Victoria Island, Nigeria',
      topicId: '0.0.90123',
      tokenId: '0.0.45678',
      operatorUserId: sarahOperator.id,
    },
  });

  // Create Well Memberships (Investments)
  await prisma.wellMembership.createMany({
    data: [
      // Sunrise Valley Well
      { userId: johnInvestor.id, wellId: sunriseWell.id, roleName: 'INVESTOR', shareBps: 2500 }, // 25%
      { userId: aliceInvestor.id, wellId: sunriseWell.id, roleName: 'INVESTOR', shareBps: 2000 }, // 20%
      { userId: johnUser.id, wellId: sunriseWell.id, roleName: 'INVESTOR', shareBps: 1500 }, // 15%
      { userId: johnOperator.id, wellId: sunriseWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
      
      // Green Hills Water Source
      { userId: johnInvestor.id, wellId: greenHillsWell.id, roleName: 'INVESTOR', shareBps: 3000 }, // 30%
      { userId: aliceInvestor.id, wellId: greenHillsWell.id, roleName: 'INVESTOR', shareBps: 2500 }, // 25%
      { userId: johnUser.id, wellId: greenHillsWell.id, roleName: 'INVESTOR', shareBps: 1000 }, // 10%
      { userId: johnOperator.id, wellId: greenHillsWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
      
      // Blue Valley Well
      { userId: johnInvestor.id, wellId: blueValleyWell.id, roleName: 'INVESTOR', shareBps: 2000 }, // 20%
      { userId: mikeOperator.id, wellId: blueValleyWell.id, roleName: 'OPERATOR', shareBps: 1500 }, // 15%
      
      // Crystal Springs Well
      { userId: davidInvestor.id, wellId: crystalSpringsWell.id, roleName: 'INVESTOR', shareBps: 3500 }, // 35%
      { userId: tomInvestor.id, wellId: crystalSpringsWell.id, roleName: 'INVESTOR', shareBps: 2500 }, // 25%
      { userId: aliceInvestor.id, wellId: crystalSpringsWell.id, roleName: 'INVESTOR', shareBps: 1500 }, // 15%
      { userId: lisaOperator.id, wellId: crystalSpringsWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
      
      // Golden Oaks Water Source
      { userId: johnInvestor.id, wellId: goldenOaksWell.id, roleName: 'INVESTOR', shareBps: 2000 }, // 20%
      { userId: davidInvestor.id, wellId: goldenOaksWell.id, roleName: 'INVESTOR', shareBps: 2000 }, // 20%
      { userId: tomInvestor.id, wellId: goldenOaksWell.id, roleName: 'INVESTOR', shareBps: 1800 }, // 18%
      { userId: mariaUser.id, wellId: goldenOaksWell.id, roleName: 'INVESTOR', shareBps: 1200 }, // 12%
      { userId: johnOperator.id, wellId: goldenOaksWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
      
      // River Bend Well
      { userId: aliceInvestor.id, wellId: riverBendWell.id, roleName: 'INVESTOR', shareBps: 3000 }, // 30%
      { userId: tomInvestor.id, wellId: riverBendWell.id, roleName: 'INVESTOR', shareBps: 2200 }, // 22%
      { userId: johnUser.id, wellId: riverBendWell.id, roleName: 'INVESTOR', shareBps: 1300 }, // 13%
      { userId: mikeOperator.id, wellId: riverBendWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
      
      // Mountain View Well
      { userId: jamesInvestor.id, wellId: mountainViewWell.id, roleName: 'INVESTOR', shareBps: 4000 }, // 40%
      { userId: davidInvestor.id, wellId: mountainViewWell.id, roleName: 'INVESTOR', shareBps: 2500 }, // 25%
      { userId: aliceInvestor.id, wellId: mountainViewWell.id, roleName: 'INVESTOR', shareBps: 2000 }, // 20%
      { userId: sarahOperator.id, wellId: mountainViewWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
      
      // Desert Spring Well
      { userId: tomInvestor.id, wellId: desertSpringWell.id, roleName: 'INVESTOR', shareBps: 3500 }, // 35%
      { userId: jamesInvestor.id, wellId: desertSpringWell.id, roleName: 'INVESTOR', shareBps: 3000 }, // 30%
      { userId: rachelUser.id, wellId: desertSpringWell.id, roleName: 'INVESTOR', shareBps: 1500 }, // 15%
      { userId: mikeOperator.id, wellId: desertSpringWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
      
      // Coastal Well
      { userId: davidInvestor.id, wellId: coastalWell.id, roleName: 'INVESTOR', shareBps: 4500 }, // 45%
      { userId: aliceInvestor.id, wellId: coastalWell.id, roleName: 'INVESTOR', shareBps: 2500 }, // 25%
      { userId: mariaUser.id, wellId: coastalWell.id, roleName: 'INVESTOR', shareBps: 1800 }, // 18%
      { userId: sarahOperator.id, wellId: coastalWell.id, roleName: 'OPERATOR', shareBps: 1000 }, // 10%
    ],
  });

  // Create Tokens
  await prisma.token.createMany({
    data: [
      {
        wellId: sunriseWell.id,
        tokenId: '0.0.67890',
        type: 'WATER_TOKEN',
        name: 'Sunrise Valley Water Token',
        symbol: 'SVWT',
        treasuryAccount: '0.0.34567',
        decimals: 2,
      },
      {
        wellId: greenHillsWell.id,
        tokenId: '0.0.78901',
        type: 'WATER_TOKEN',
        name: 'Green Hills Water Token',
        symbol: 'GHWT',
        treasuryAccount: '0.0.34567',
        decimals: 2,
      },
      {
        wellId: blueValleyWell.id,
        tokenId: '0.0.89012',
        type: 'WATER_TOKEN',
        name: 'Blue Valley Water Token',
        symbol: 'BVWT',
        treasuryAccount: '0.0.56789',
        decimals: 2,
      },
      {
        wellId: crystalSpringsWell.id,
        tokenId: '0.0.90123',
        type: 'WATER_TOKEN',
        name: 'Crystal Springs Water Token',
        symbol: 'CSWT',
        treasuryAccount: '0.0.456789',
        decimals: 2,
      },
      {
        wellId: goldenOaksWell.id,
        tokenId: '0.0.01234',
        type: 'WATER_TOKEN',
        name: 'Golden Oaks Water Token',
        symbol: 'GOWT',
        treasuryAccount: '0.0.34567',
        decimals: 2,
      },
      {
        wellId: riverBendWell.id,
        tokenId: '0.0.12345',
        type: 'WATER_TOKEN',
        name: 'River Bend Water Token',
        symbol: 'RBWT',
        treasuryAccount: '0.0.56789',
        decimals: 2,
      },
      {
        wellId: mountainViewWell.id,
        tokenId: '0.0.23456',
        type: 'WATER_TOKEN',
        name: 'Mountain View Water Token',
        symbol: 'MVWT',
        treasuryAccount: '0.0.890123',
        decimals: 2,
      },
      {
        wellId: desertSpringWell.id,
        tokenId: '0.0.34567',
        type: 'WATER_TOKEN',
        name: 'Desert Spring Water Token',
        symbol: 'DSWT',
        treasuryAccount: '0.0.56789',
        decimals: 2,
      },
      {
        wellId: coastalWell.id,
        tokenId: '0.0.45678',
        type: 'WATER_TOKEN',
        name: 'Coastal Fresh Water Token',
        symbol: 'CFWT',
        treasuryAccount: '0.0.890123',
        decimals: 2,
      },
    ],
  });

  // Create HCS Events
  await prisma.hcsEvent.createMany({
    data: [
      {
        wellId: sunriseWell.id,
        type: 'WELL_CREATED',
        messageId: 'msg-001',
        consensusTime: new Date('2024-01-20T10:30:00Z'),
        sequenceNumber: BigInt(1),
        txId: '0.0.12345@1705747800.123456789',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-001',
          action: 'created',
          details: 'Well WTR-001 has been successfully created and registered on Hedera'
        }),
        hash: 'hash001',
      },
      {
        wellId: sunriseWell.id,
        type: 'MILESTONE_VERIFIED',
        messageId: 'msg-002',
        consensusTime: new Date('2024-01-20T09:15:00Z'),
        sequenceNumber: BigInt(2),
        txId: '0.0.12345@1705743300.987654321',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-001',
          milestone: 'production',
          verifiedBy: 'agent',
          production: 4750.5
        }),
        hash: 'hash002',
      },
      {
        wellId: greenHillsWell.id,
        type: 'PAYOUT_EXECUTED',
        messageId: 'msg-003',
        consensusTime: new Date('2024-01-20T08:45:00Z'),
        sequenceNumber: BigInt(3),
        txId: '0.0.12345@1705741500.456789123',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-002',
          action: 'payout',
          amount: 1250,
          currency: 'HBAR'
        }),
        hash: 'hash003',
      },
      {
        wellId: crystalSpringsWell.id,
        type: 'WELL_CREATED',
        messageId: 'msg-004',
        consensusTime: new Date('2024-01-21T14:20:00Z'),
        sequenceNumber: BigInt(4),
        txId: '0.0.45678@1705848000.123456789',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-004',
          action: 'created',
          details: 'Crystal Springs Well has been successfully created and registered'
        }),
        hash: 'hash004',
      },
      {
        wellId: goldenOaksWell.id,
        type: 'MILESTONE_VERIFIED',
        messageId: 'msg-005',
        consensusTime: new Date('2024-01-22T11:30:00Z'),
        sequenceNumber: BigInt(5),
        txId: '0.0.56789@1705924200.987654321',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-005',
          milestone: 'production',
          verifiedBy: 'agent',
          production: 6200.8
        }),
        hash: 'hash005',
      },
      {
        wellId: riverBendWell.id,
        type: 'PAYOUT_EXECUTED',
        messageId: 'msg-006',
        consensusTime: new Date('2024-01-23T16:45:00Z'),
        sequenceNumber: BigInt(6),
        txId: '0.0.67890@1706029500.456789123',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-006',
          action: 'payout',
          amount: 1850,
          currency: 'HBAR'
        }),
        hash: 'hash006',
      },
      {
        wellId: mountainViewWell.id,
        type: 'WATER_QUALITY_UPDATE',
        messageId: 'msg-007',
        consensusTime: new Date('2024-02-01T10:00:00Z'),
        sequenceNumber: BigInt(7),
        txId: '0.0.78901@1706774400.123456789',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-007',
          action: 'quality_test',
          testedBy: 'agent',
          compliance: true
        }),
        hash: 'hash007',
      },
      {
        wellId: desertSpringWell.id,
        type: 'MILESTONE_VERIFIED',
        messageId: 'msg-008',
        consensusTime: new Date('2024-02-10T09:15:00Z'),
        sequenceNumber: BigInt(8),
        txId: '0.0.89012@1707552900.987654321',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-008',
          milestone: 'maintenance',
          verifiedBy: 'operator',
          details: 'Scheduled maintenance completed'
        }),
        hash: 'hash008',
      },
      {
        wellId: coastalWell.id,
        type: 'PAYOUT_EXECUTED',
        messageId: 'msg-009',
        consensusTime: new Date('2024-02-20T16:45:00Z'),
        sequenceNumber: BigInt(9),
        txId: '0.0.90123@1708448700.456789123',
        payloadJson: JSON.stringify({ 
          wellCode: 'WTR-009',
          action: 'payout',
          amount: 2100,
          currency: 'HBAR'
        }),
        hash: 'hash009',
      },
    ],
  });

  // Create Water Quality Records
   await prisma.waterQuality.createMany({
     data: [
       {
         wellId: sunriseWell.id,
         ph: 7.2,
         turbidity: 0.5,
         tds: 150.0,
         temperature: 25.5,
         chlorine: 0.2,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Sarah Agent',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: crystalSpringsWell.id,
         ph: 7.1,
         turbidity: 0.2,
         tds: 110.0,
         temperature: 24.2,
         chlorine: 0.18,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Emma Wilson',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: goldenOaksWell.id,
         ph: 7.3,
         turbidity: 0.6,
         tds: 165.0,
         temperature: 25.8,
         chlorine: 0.22,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Alex Thompson',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: riverBendWell.id,
         ph: 6.9,
         turbidity: 0.4,
         tds: 140.0,
         temperature: 26.5,
         chlorine: 0.19,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Emma Wilson',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: greenHillsWell.id,
         ph: 7.0,
         turbidity: 0.3,
         tds: 120.0,
         temperature: 24.8,
         chlorine: 0.15,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Sarah Agent',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: blueValleyWell.id,
         ph: 7.4,
         turbidity: 0.4,
         tds: 180.0,
         temperature: 26.2,
         chlorine: 0.25,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Sarah Agent',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: mountainViewWell.id,
         ph: 7.5,
         turbidity: 0.3,
         tds: 125.0,
         temperature: 23.8,
         chlorine: 0.17,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Kevin Agent',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: desertSpringWell.id,
         ph: 6.8,
         turbidity: 0.7,
         tds: 195.0,
         temperature: 27.2,
         chlorine: 0.28,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Alex Thompson',
         certificationBody: 'Nigerian Water Quality Board',
       },
       {
         wellId: coastalWell.id,
         ph: 7.6,
         turbidity: 0.2,
         tds: 105.0,
         temperature: 24.5,
         chlorine: 0.14,
         bacteria: 0.0,
         compliance: true,
         testedBy: 'Emma Wilson',
         certificationBody: 'Nigerian Water Quality Board',
       },
     ],
   });

  // Create Settlements
  const settlement1 = await prisma.settlement.create({
    data: {
      wellId: sunriseWell.id,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      kwhTotal: 4750.5,
      grossRevenue: 4200.0,
      status: 'COMPLETED',
      requestEventId: 'req-001',
      approvalEventId: 'app-001',
      executeEventId: 'exe-001',
    },
  });

  const settlement2 = await prisma.settlement.create({
    data: {
      wellId: greenHillsWell.id,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      kwhTotal: 7200.0,
      grossRevenue: 6300.0,
      status: 'COMPLETED',
      requestEventId: 'req-002',
      executeEventId: 'exe-002',
    },
  });

  const settlement3 = await prisma.settlement.create({
    data: {
      wellId: crystalSpringsWell.id,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      kwhTotal: 8500.0,
      grossRevenue: 7650.0,
      status: 'COMPLETED',
      requestEventId: 'req-003',
      executeEventId: 'exe-003',
    },
  });

  const settlement4 = await prisma.settlement.create({
    data: {
      wellId: goldenOaksWell.id,
      periodStart: new Date('2024-02-01'),
      periodEnd: new Date('2024-02-29'),
      kwhTotal: 6200.8,
      grossRevenue: 5580.0,
      status: 'PENDING',
      requestEventId: 'req-004',
      approvalEventId: null,
      executeEventId: null,
    },
  });

  const settlement5 = await prisma.settlement.create({
    data: {
      wellId: riverBendWell.id,
      periodStart: new Date('2024-02-01'),
      periodEnd: new Date('2024-02-29'),
      kwhTotal: 5400.0,
      grossRevenue: 4860.0,
      status: 'COMPLETED',
      requestEventId: 'req-005',
      executeEventId: 'exe-005',
    },
  });

  const settlement6 = await prisma.settlement.create({
    data: {
      wellId: mountainViewWell.id,
      periodStart: new Date('2024-02-01'),
      periodEnd: new Date('2024-02-29'),
      kwhTotal: 7800.0,
      grossRevenue: 7020.0,
      status: 'COMPLETED',
      requestEventId: 'req-006',
      executeEventId: 'exe-006',
    },
  });

  const settlement7 = await prisma.settlement.create({
    data: {
      wellId: desertSpringWell.id,
      periodStart: new Date('2024-02-01'),
      periodEnd: new Date('2024-02-29'),
      kwhTotal: 5900.0,
      grossRevenue: 5310.0,
      status: 'PENDING',
      requestEventId: 'req-007',
      approvalEventId: null,
      executeEventId: null,
    },
  });

  const settlement8 = await prisma.settlement.create({
    data: {
      wellId: coastalWell.id,
      periodStart: new Date('2024-03-01'),
      periodEnd: new Date('2024-03-31'),
      kwhTotal: 9200.0,
      grossRevenue: 8280.0,
      status: 'COMPLETED',
      requestEventId: 'req-008',
      executeEventId: 'exe-008',
    },
  });

  // Create Payouts
  await prisma.payout.createMany({
    data: [
      // Payouts for Settlement 1 (Sunrise Valley)
       {
         settlementId: settlement1.id,
         recipientAccount: johnInvestor.accountId || '0.0.12345',
         assetType: 'HBAR',
         amount: 1050.0, // 25% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-001',
       },
       {
         settlementId: settlement1.id,
         recipientAccount: aliceInvestor.accountId || '0.0.45678',
         assetType: 'HBAR',
         amount: 840.0, // 20% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-002',
       },
       {
         settlementId: settlement1.id,
         recipientAccount: johnUser.accountId || '0.0.123456',
         assetType: 'HBAR',
         amount: 630.0, // 15% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-003',
       },
       
       // Payouts for Settlement 2 (Green Hills)
       {
         settlementId: settlement2.id,
         recipientAccount: johnInvestor.accountId || '0.0.12345',
         assetType: 'HBAR',
         amount: 1890.0, // 30% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-004',
       },
       {
         settlementId: settlement2.id,
         recipientAccount: aliceInvestor.accountId || '0.0.45678',
         assetType: 'HBAR',
         amount: 1575.0, // 25% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-005',
       },
       
       // Payouts for Settlement 3 (Crystal Springs)
       {
         settlementId: settlement3.id,
         recipientAccount: davidInvestor.accountId || '0.0.345678',
         assetType: 'HBAR',
         amount: 2677.5, // 35% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-006',
       },
       {
         settlementId: settlement3.id,
         recipientAccount: tomInvestor.accountId || '0.0.567890',
         assetType: 'HBAR',
         amount: 1912.5, // 25% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-007',
       },
       {
         settlementId: settlement3.id,
         recipientAccount: aliceInvestor.accountId || '0.0.45678',
         assetType: 'HBAR',
         amount: 1147.5, // 15% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-008',
       },
       
       // Payouts for Settlement 5 (River Bend)
       {
         settlementId: settlement5.id,
         recipientAccount: aliceInvestor.accountId || '0.0.45678',
         assetType: 'HBAR',
         amount: 1458.0, // 30% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-009',
       },
       {
         settlementId: settlement5.id,
         recipientAccount: tomInvestor.accountId || '0.0.567890',
         assetType: 'HBAR',
         amount: 1069.2, // 22% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-010',
       },
       {
         settlementId: settlement5.id,
         recipientAccount: johnUser.accountId || '0.0.123456',
         assetType: 'HBAR',
         amount: 631.8, // 13% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-011',
       },
       
       // Payouts for Settlement 6 (Mountain View)
       {
         settlementId: settlement6.id,
         recipientAccount: jamesInvestor.accountId || '0.0.901234',
         assetType: 'HBAR',
         amount: 2808.0, // 40% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-012',
       },
       {
         settlementId: settlement6.id,
         recipientAccount: davidInvestor.accountId || '0.0.345678',
         assetType: 'HBAR',
         amount: 1755.0, // 25% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-013',
       },
       {
         settlementId: settlement6.id,
         recipientAccount: aliceInvestor.accountId || '0.0.45678',
         assetType: 'HBAR',
         amount: 1404.0, // 20% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-014',
       },
       
       // Payouts for Settlement 8 (Coastal)
       {
         settlementId: settlement8.id,
         recipientAccount: davidInvestor.accountId || '0.0.345678',
         assetType: 'HBAR',
         amount: 3726.0, // 45% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-015',
       },
       {
         settlementId: settlement8.id,
         recipientAccount: aliceInvestor.accountId || '0.0.45678',
         assetType: 'HBAR',
         amount: 2070.0, // 25% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-016',
       },
       {
         settlementId: settlement8.id,
         recipientAccount: mariaUser.accountId || '0.0.678901',
         assetType: 'HBAR',
         amount: 1490.4, // 18% of revenue
         status: 'COMPLETED',
         txId: 'tx-payout-017',
       },
    ],
  });

  console.log(`Seeding finished with comprehensive mock data.`);
  console.log(`Created:`);
  console.log(`- 16 users (operators, agents, investors, users)`);
  console.log(`- 9 wells with different locations across Nigeria`);
  console.log(`- 31 well memberships (investments)`);
  console.log(`- 9 tokens`);
  console.log(`- 9 HCS events`);
  console.log(`- 9 water quality records`);
  console.log(`- 8 settlements (6 completed, 2 pending)`);
  console.log(`- 17 payouts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });