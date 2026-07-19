const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.rentalOrder.count();
  const first = await prisma.rentalOrder.findFirst();
  console.log('Count:', count);
  console.log('First:', first);
}
main().finally(() => prisma.$disconnect());
