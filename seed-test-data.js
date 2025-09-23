const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create test operator user
  const operator = await prisma.user.create({
    data: {
      username: 'test_operator',
      name: 'Test Operator',
      password: 'test123',
      walletEvm: '0x1234567890123456789012345678901234567890',
      role: 'OPERATOR'
    }
  });

  console.log('Created operator:', operator);

  // Create test well
  const well = await prisma.well.create({
    data: {
      code: 'WELL001',
      name: 'Test Well for Water Quality',
      location: 'Test Location, Lagos',
      topicId: '0.0.123456',
      operatorUserId: operator.id
    }
  });

  console.log('Created well:', well);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });