const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRoles() {
  try {
    console.log('🔍 Checking available roles in database...');
    
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    
    console.log('📋 Available roles:');
    roles.forEach(role => {
      console.log(`  - ID: ${role.id}, Name: ${role.name}, Users: ${role._count.users}`);
    });
    
    // Find OPERATOR role specifically
    const operatorRole = roles.find(r => r.name === 'OPERATOR');
    if (operatorRole) {
      console.log(`\n✅ OPERATOR role found with ID: ${operatorRole.id}`);
      return operatorRole.id;
    } else {
      console.log('\n❌ OPERATOR role not found');
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error checking roles:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles()
  .then(operatorRoleId => {
    if (operatorRoleId) {
      console.log(`\n🎯 Use this role ID for OPERATOR: ${operatorRoleId}`);
    }
  })
  .catch(console.error);