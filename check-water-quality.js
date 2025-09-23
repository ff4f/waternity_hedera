const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWaterQuality() {
  try {
    console.log('Checking Water Quality Records...');
    
    const records = await prisma.waterQuality.findMany({
      include: {
        well: true,
        hcsEvent: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${records.length} water quality records:`);
    
    records.forEach((record, index) => {
      console.log(`\n${index + 1}. Record ID: ${record.id}`);
      console.log(`   Well: ${record.well.name} (${record.wellId})`);
      console.log(`   pH: ${record.ph}`);
      console.log(`   Turbidity: ${record.turbidity}`);
      console.log(`   TDS: ${record.tds}`);
      console.log(`   Temperature: ${record.temperature}`);
      console.log(`   Chlorine: ${record.chlorine}`);
      console.log(`   Bacteria: ${record.bacteria}`);
      console.log(`   Compliance: ${record.compliance}`);
      console.log(`   Tested By: ${record.testedBy}`);
      console.log(`   Certification Body: ${record.certificationBody || 'N/A'}`);
      console.log(`   HCS Event ID: ${record.hcsEventId || 'N/A'}`);
      console.log(`   Created: ${record.createdAt}`);
    });
    
    // Also check idempotency records
    console.log('\n--- Idempotency Records ---');
    const idempotencyRecords = await prisma.idempotency.findMany({
      where: {
        scope: 'water_quality_create'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${idempotencyRecords.length} idempotency records:`);
    idempotencyRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Key: ${record.key}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Result Hash: ${record.resultHash || 'N/A'}`);
      console.log(`   Created: ${record.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWaterQuality();