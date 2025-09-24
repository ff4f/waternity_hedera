const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Check wells
    const wells = await prisma.well.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        topicId: true,
        tokenId: true
      }
    });
    
    console.log('Wells found:', wells.length);
    console.log('Wells:', JSON.stringify(wells, null, 2));
    
    // Check HCS events
    const events = await prisma.hcsEvent.findMany({
      take: 3,
      select: {
        id: true,
        wellId: true,
        type: true,
        messageId: true
      }
    });
    
    console.log('HCS Events found:', events.length);
    console.log('Events:', JSON.stringify(events, null, 2));
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();