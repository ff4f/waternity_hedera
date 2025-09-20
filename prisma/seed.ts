import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const operator = await prisma.user.create({
    data: {
      name: 'Bob',
      role: 'OPERATOR',
    },
  });

  const investor = await prisma.user.create({
    data: {
      name: 'Alice',
      role: 'INVESTOR',
    },
  });

  const well1 = await prisma.well.create({
    data: {
      code: 'WELL-001',
      name: 'Well 1',
      location: 'Location 1',
      topicId: '0.0.12345',
      operatorUserId: operator.id,
    },
  });

  const well2 = await prisma.well.create({
    data: {
      code: 'WELL-002',
      name: 'Well 2',
      location: 'Location 2',
      topicId: '0.0.54321',
      operatorUserId: operator.id,
    },
  });

  await prisma.wellMembership.createMany({
    data: [
      { userId: investor.id, wellId: well1.id, roleName: 'INVESTOR', shareBps: 5000 },
      { userId: operator.id, wellId: well1.id, roleName: 'OPERATOR', shareBps: 1000 },
      { userId: investor.id, wellId: well2.id, roleName: 'INVESTOR', shareBps: 10000 },
    ],
  });

  await prisma.hcsEvent.createMany({
    data: [
      {
        wellId: well1.id,
        type: 'METER_READING',
        messageId: '1',
        consensusTime: new Date(),
        sequenceNumber: BigInt(1),
        payloadJson: JSON.stringify({ reading: 100 }),
      },
      {
        wellId: well1.id,
        type: 'METER_READING',
        messageId: '2',
        consensusTime: new Date(),
        sequenceNumber: BigInt(2),
        payloadJson: JSON.stringify({ reading: 200 }),
      },
    ],
  });

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });