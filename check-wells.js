const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWells() {
  try {
    const wells = await prisma.well.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        location: true
      }
    });
    
    console.log('Available wells:');
    wells.forEach(well => {
      console.log(`ID: ${well.id}`);
      console.log(`Name: ${well.name}`);
      console.log(`Code: ${well.code}`);
      console.log(`Location: ${well.location}`);
      console.log('---');
    });
    
    if (wells.length === 0) {
      console.log('No wells found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWells();