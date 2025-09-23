const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testHcsEvent() {
  try {
    console.log('Testing HCS Event creation...');
    
    // First check if well exists
    const well = await prisma.well.findFirst();
    if (!well) {
      console.log('No wells found in database');
      return;
    }
    
    console.log('Found well:', well.id, well.name);
    
    // Try to create HCS event
    const hcsEvent = await prisma.hcsEvent.create({
      data: {
        wellId: well.id,
        type: 'WATER_QUALITY_TEST',
        payloadJson: JSON.stringify({ test: 'data' }),
        sequenceNumber: BigInt(Math.floor(Math.random() * 1000000)),
        consensusTime: new Date(),
        hash: 'test-hash-' + Date.now(),
        messageId: 'test-message-' + Date.now()
      }
    });
    
    console.log('HCS Event created successfully:', hcsEvent.id);
    
    // Now try to create water quality record
    const waterQuality = await prisma.waterQuality.create({
      data: {
        wellId: well.id,
        ph: 7.2,
        turbidity: 1.5,
        tds: 150,
        temperature: 22.5,
        chlorine: 0.5,
        bacteria: 0,
        compliance: true,
        testedBy: 'Test Lab',
        hcsEventId: hcsEvent.id
      }
    });
    
    console.log('Water Quality record created successfully:', waterQuality.id);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testHcsEvent();