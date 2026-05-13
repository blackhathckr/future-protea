const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Seeding database with admin user...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cricket.com' },
      update: {},
      create: {
        name: 'Admin',
        email: 'admin@cricket.com',
        password: hashedPassword,
        role: 'admin',
        approved: true,
      },
    });

    console.log('✅ Admin user created/updated:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Approved: ${admin.approved}\n`);

    // Create test users for all roles
    const testUsers = [
      { name: 'Admin Feeder', email: 'admin.feeder@cricket.com', role: 'feeder' },
      { name: 'Admin Viewer', email: 'admin.viewer@cricket.com', role: 'viewer' },
      { name: 'Admin Player', email: 'admin.player@cricket.com', role: 'player' },
      { name: 'Feeder User', email: 'feeder@cricket.com', role: 'feeder' },
      { name: 'Cricket Fan', email: 'viewer@cricket.com', role: 'viewer' },
      { name: 'Cricket Player', email: 'player@cricket.com', role: 'player' },
    ];

    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          approved: true,
        },
      });
      console.log(`✅ ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} user created:`);
      console.log(`   Email: ${user.email}`);
    }

    console.log('\n📋 Admin Credentials (All Roles):');
    console.log('   Admin Role:   admin@cricket.com / password123');
    console.log('   Feeder Role:  admin.feeder@cricket.com / password123');
    console.log('   Viewer Role:  admin.viewer@cricket.com / password123');
    console.log('   Player Role:  admin.player@cricket.com / password123');
    console.log('\n📋 Regular User Credentials:');
    console.log('   Feeder:  feeder@cricket.com / password123');
    console.log('   Viewer:  viewer@cricket.com / password123');
    console.log('   Player:  player@cricket.com / password123');
    console.log('\n✨ Seeding complete!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
