import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Users Count:', await prisma.user.count());
  console.log('Products Count:', await prisma.product.count());
}
main().finally(() => prisma.$disconnect());
