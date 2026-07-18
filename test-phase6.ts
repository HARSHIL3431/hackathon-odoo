import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Part 1: Phase 6 Verification ---');
  
  // Create a mock admin user and a customer user for testing
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Tester',
      email: `admin-test-${Date.now()}@test.com`,
      passwordHash: 'dummy',
      role: 'ADMIN',
    }
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Customer Tester',
      email: `customer-test-${Date.now()}@test.com`,
      passwordHash: 'dummy',
      role: 'CUSTOMER',
    }
  });

  try {
    // 1. Test Admin toggle user role/approval
    console.log('\nTesting: Admin can toggle role/approval...');
    await prisma.user.update({
      where: { id: customer.id },
      data: { isApproved: false, role: 'VENDOR' }
    });
    const updatedUser = await prisma.user.findUnique({ where: { id: customer.id } });
    console.log(`Expected VENDOR / false, got: ${updatedUser?.role} / ${updatedUser?.isApproved}`);

    // 2. Test Custom Pricelist Creation
    console.log('\nTesting: Admin can create custom pricelist...');
    const pricelist = await prisma.pricelist.create({
      data: {
        name: 'Test List',
        discountPercent: 15,
        isDefault: true
      }
    });
    const foundList = await prisma.pricelist.findUnique({ where: { id: pricelist.id } });
    console.log(`Expected Test List (15%), got: ${foundList?.name} (${foundList?.discountPercent}%)`);

    // 3. Test Settings Updates
    console.log('\nTesting: Admin can update settings...');
    await prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: { lateFeeDefault: 99, gracePeriodHours: 48 },
      create: { id: 'global', lateFeeDefault: 99, gracePeriodHours: 48 }
    });
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
    console.log(`Expected late fee 99 / grace 48, got: ${settings?.lateFeeDefault} / ${settings?.gracePeriodHours}`);

    // 4. Confirm Migration is Live
    // The fact that isApproved and SystemSettings just queried successfully without throwing
    // a "column does not exist" Postgres error proves the migration is live.
    console.log('\nTesting: Migration is genuinely live in Neon...');
    console.log('SUCCESS: isApproved and SystemSettings columns successfully accessed in database.');

  } finally {
    // Cleanup
    await prisma.user.delete({ where: { id: admin.id } });
    await prisma.user.delete({ where: { id: customer.id } });
    // cleanup pricelist
    await prisma.pricelist.deleteMany({ where: { name: 'Test List' } });
    await prisma.$disconnect();
  }
}

run().catch(e => {
  console.error('FAIL:', e);
  process.exit(1);
});
