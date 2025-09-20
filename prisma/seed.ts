import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles first
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'INVESTOR' },
      update: {},
      create: {
        name: 'INVESTOR',
        description: 'Can invest in projects and view returns',
        permissions: {
          canInvest: true,
          canViewReturns: true,
          canViewWellDetails: true
        }
      }
    }),
    prisma.role.upsert({
      where: { name: 'OPERATOR' },
      update: {},
      create: {
        name: 'OPERATOR',
        description: 'Can create and manage water projects',
        permissions: {
          canCreateWells: true,
          canManageWells: true,
          canRequestSettlements: true,
          canUploadDocuments: true
        }
      }
    }),
    prisma.role.upsert({
      where: { name: 'AGENT' },
      update: {},
      create: {
        name: 'AGENT',
        description: 'Can verify milestones and control valves',
        permissions: {
          canVerifyMilestones: true,
          canControlValves: true,
          canAuditWells: true
        }
      }
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Full system administration access',
        permissions: {
          canManageUsers: true,
          canManageRoles: true,
          canViewAllData: true,
          canExecuteSettlements: true
        }
      }
    })
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // Create 3 users with different roles
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { walletEvm: '0x1234567890123456789012345678901234567890' },
      update: {},
      create: {
        name: 'Alice Investor',
        walletEvm: '0x1234567890123456789012345678901234567890',
        email: 'alice@waternity.com',
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { walletEvm: '0x2345678901234567890123456789012345678901' },
      update: {},
      create: {
        name: 'Bob Operator',
        walletEvm: '0x2345678901234567890123456789012345678901',
        email: 'bob@waternity.com',
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { walletEvm: '0x3456789012345678901234567890123456789012' },
      update: {},
      create: {
        name: 'Charlie Agent',
        walletEvm: '0x3456789012345678901234567890123456789012',
        email: 'charlie@waternity.com',
        isActive: true
      }
    })
  ]);

  console.log(`✅ Created ${users.length} users`);

  const [alice, bob, charlie] = users;

  // Create 2 wells with dummy topicIds
  console.log('Creating wells...');
  const wells = await Promise.all([
    prisma.well.upsert({
      where: { code: 'WL-001' },
      update: {},
      create: {
        code: 'WL-001',
        name: 'Bandung Water Well Alpha',
        location: 'Bandung, West Java, Indonesia',
        latitude: -6.9175,
        longitude: 107.6191,
        topicId: '0.0.123456', // Dummy HCS Topic ID
        tokenId: '0.0.789012', // Dummy HTS Token ID
        operatorUserId: bob.id,
        depth: 150.5,
        capacity: 5000.0,
        status: 'ACTIVE'
      }
    }),
    prisma.well.upsert({
      where: { code: 'WL-002' },
      update: {},
      create: {
        code: 'WL-002',
        name: 'Jakarta Water Well Beta',
        location: 'Jakarta, DKI Jakarta, Indonesia',
        latitude: -6.2088,
        longitude: 106.8456,
        topicId: '0.0.234567', // Dummy HCS Topic ID
        tokenId: '0.0.890123', // Dummy HTS Token ID
        operatorUserId: bob.id,
        depth: 200.0,
        capacity: 7500.0,
        status: 'ACTIVE'
      }
    })
  ]);

  console.log(`✅ Created ${wells.length} wells`);

  const [wellAlpha, wellBeta] = wells;

  // Create well memberships
  console.log('Creating well memberships...');
  const memberships = await Promise.all([
    // Well Alpha memberships
    prisma.wellMembership.upsert({
      where: {
        userId_wellId_roleName: {
          userId: alice.id,
          wellId: wellAlpha.id,
          roleName: 'INVESTOR'
        }
      },
      update: {},
      create: {
        userId: alice.id,
        wellId: wellAlpha.id,
        roleName: 'INVESTOR',
        shareBps: 6000 // 60% share
      }
    }),
    prisma.wellMembership.upsert({
      where: {
        userId_wellId_roleName: {
          userId: bob.id,
          wellId: wellAlpha.id,
          roleName: 'OPERATOR'
        }
      },
      update: {},
      create: {
        userId: bob.id,
        wellId: wellAlpha.id,
        roleName: 'OPERATOR',
        shareBps: 3000 // 30% share
      }
    }),
    prisma.wellMembership.upsert({
      where: {
        userId_wellId_roleName: {
          userId: charlie.id,
          wellId: wellAlpha.id,
          roleName: 'AGENT'
        }
      },
      update: {},
      create: {
        userId: charlie.id,
        wellId: wellAlpha.id,
        roleName: 'AGENT',
        shareBps: 1000 // 10% share
      }
    }),
    // Well Beta memberships
    prisma.wellMembership.upsert({
      where: {
        userId_wellId_roleName: {
          userId: alice.id,
          wellId: wellBeta.id,
          roleName: 'INVESTOR'
        }
      },
      update: {},
      create: {
        userId: alice.id,
        wellId: wellBeta.id,
        roleName: 'INVESTOR',
        shareBps: 7000 // 70% share
      }
    }),
    prisma.wellMembership.upsert({
      where: {
        userId_wellId_roleName: {
          userId: bob.id,
          wellId: wellBeta.id,
          roleName: 'OPERATOR'
        }
      },
      update: {},
      create: {
        userId: bob.id,
        wellId: wellBeta.id,
        roleName: 'OPERATOR',
        shareBps: 2500 // 25% share
      }
    }),
    prisma.wellMembership.upsert({
      where: {
        userId_wellId_roleName: {
          userId: charlie.id,
          wellId: wellBeta.id,
          roleName: 'AGENT'
        }
      },
      update: {},
      create: {
        userId: charlie.id,
        wellId: wellBeta.id,
        roleName: 'AGENT',
        shareBps: 500 // 5% share
      }
    })
  ]);

  console.log(`✅ Created ${memberships.length} well memberships`);

  // Create 6 sample HCS events
  console.log('Creating sample HCS events...');
  const baseTime = new Date('2024-01-15T10:00:00Z');
  
  const events = await Promise.all([
    // Well Alpha events
    prisma.hcsEvent.upsert({
      where: { messageId: 'msg_001_well_created' },
      update: {},
      create: {
        wellId: wellAlpha.id,
        type: 'WELL_CREATED',
        messageId: 'msg_001_well_created',
        consensusTime: new Date(baseTime.getTime()),
        sequenceNumber: BigInt(1),
        txId: '0.0.123456@1705316400.123456789',
        payloadJson: {
          wellCode: 'WL-001',
          operatorId: bob.id,
          location: 'Bandung, West Java, Indonesia',
          depth: 150.5,
          capacity: 5000.0
        },
        hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
      }
    }),
    prisma.hcsEvent.upsert({
      where: { messageId: 'msg_002_milestone_verified' },
      update: {},
      create: {
        wellId: wellAlpha.id,
        type: 'MILESTONE_VERIFIED',
        messageId: 'msg_002_milestone_verified',
        consensusTime: new Date(baseTime.getTime() + 3600000), // +1 hour
        sequenceNumber: BigInt(2),
        txId: '0.0.123456@1705320000.123456789',
        payloadJson: {
          milestoneType: 'DRILLING_COMPLETED',
          verifiedBy: charlie.id,
          depth: 150.5,
          waterQuality: 'EXCELLENT',
          flowRate: 5000.0
        },
        hash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567'
      }
    }),
    prisma.hcsEvent.upsert({
      where: { messageId: 'msg_003_settlement_requested' },
      update: {},
      create: {
        wellId: wellAlpha.id,
        type: 'SETTLEMENT_REQUESTED',
        messageId: 'msg_003_settlement_requested',
        consensusTime: new Date(baseTime.getTime() + 7200000), // +2 hours
        sequenceNumber: BigInt(3),
        txId: '0.0.123456@1705323600.123456789',
        payloadJson: {
          periodStart: '2024-01-01T00:00:00Z',
          periodEnd: '2024-01-31T23:59:59Z',
          kwhTotal: 1250.5,
          grossRevenue: 500.25,
          operationalCosts: 75.50,
          netRevenue: 424.75
        },
        hash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678'
      }
    }),
    // Well Beta events
    prisma.hcsEvent.upsert({
      where: { messageId: 'msg_004_well_created' },
      update: {},
      create: {
        wellId: wellBeta.id,
        type: 'WELL_CREATED',
        messageId: 'msg_004_well_created',
        consensusTime: new Date(baseTime.getTime() + 10800000), // +3 hours
        sequenceNumber: BigInt(4),
        txId: '0.0.234567@1705327200.123456789',
        payloadJson: {
          wellCode: 'WL-002',
          operatorId: bob.id,
          location: 'Jakarta, DKI Jakarta, Indonesia',
          depth: 200.0,
          capacity: 7500.0
        },
        hash: 'd4e5f6789012345678901234567890abcdef1234567890abcdef123456789'
      }
    }),
    prisma.hcsEvent.upsert({
      where: { messageId: 'msg_005_token_minted' },
      update: {},
      create: {
        wellId: wellBeta.id,
        type: 'TOKEN_MINTED',
        messageId: 'msg_005_token_minted',
        consensusTime: new Date(baseTime.getTime() + 14400000), // +4 hours
        sequenceNumber: BigInt(5),
        txId: '0.0.234567@1705330800.123456789',
        payloadJson: {
          tokenId: '0.0.890123',
          tokenType: 'HTS_FT',
          name: 'Jakarta Water Token',
          symbol: 'JWT',
          totalSupply: 1000000,
          decimals: 8
        },
        hash: 'e5f6789012345678901234567890abcdef1234567890abcdef1234567890'
      }
    }),
    prisma.hcsEvent.upsert({
      where: { messageId: 'msg_006_payout_executed' },
      update: {},
      create: {
        wellId: wellBeta.id,
        type: 'PAYOUT_EXECUTED',
        messageId: 'msg_006_payout_executed',
        consensusTime: new Date(baseTime.getTime() + 18000000), // +5 hours
        sequenceNumber: BigInt(6),
        txId: '0.0.234567@1705334400.123456789',
        payloadJson: {
          settlementId: 'settlement_001',
          totalPayouts: 3,
          totalAmount: 350.75,
          assetType: 'HBAR',
          recipients: [
            { wallet: alice.walletEvm, amount: 245.525 }, // 70%
            { wallet: bob.walletEvm, amount: 87.6875 },   // 25%
            { wallet: charlie.walletEvm, amount: 17.5375 } // 5%
          ]
        },
        hash: 'f6789012345678901234567890abcdef1234567890abcdef12345678901'
      }
    })
  ]);

  console.log(`✅ Created ${events.length} HCS events`);

  // Create sample tokens
  console.log('Creating sample tokens...');
  const tokens = await Promise.all([
    prisma.token.upsert({
      where: { tokenId: '0.0.789012' },
      update: {},
      create: {
        wellId: wellAlpha.id,
        tokenId: '0.0.789012',
        type: 'HTS_FT',
        name: 'Bandung Water Token',
        symbol: 'BWT',
        treasuryAccount: '0.0.123456',
        decimals: 8,
        totalSupply: 500000,
        circulatingSupply: 250000
      }
    }),
    prisma.token.upsert({
      where: { tokenId: '0.0.890123' },
      update: {},
      create: {
        wellId: wellBeta.id,
        tokenId: '0.0.890123',
        type: 'HTS_FT',
        name: 'Jakarta Water Token',
        symbol: 'JWT',
        treasuryAccount: '0.0.234567',
        decimals: 8,
        totalSupply: 1000000,
        circulatingSupply: 500000
      }
    })
  ]);

  console.log(`✅ Created ${tokens.length} tokens`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • ${roles.length} roles`);
  console.log(`   • ${users.length} users`);
  console.log(`   • ${wells.length} wells`);
  console.log(`   • ${memberships.length} well memberships`);
  console.log(`   • ${events.length} HCS events`);
  console.log(`   • ${tokens.length} tokens`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });