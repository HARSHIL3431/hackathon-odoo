import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // Seed Admin
  await prisma.user.upsert({
    where: { email: 'admin@rental.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@rental.com',
      passwordHash,
      role: Role.ADMIN,
    },
  })

  // Seed Customers
  await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'customer1@example.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  })

  await prisma.user.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'customer2@example.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  })

  // Seed Products
  const products = [
    {
      name: 'Heavy Duty Drill',
      description: 'Professional grade power drill',
      rentalPricePerDay: 50.0,
      depositAmount: 150.0,
      lateFeePerDay: 20.0,
      stockQty: 5,
    },
    {
      name: 'Concrete Mixer',
      description: 'Portable concrete mixer',
      rentalPricePerDay: 120.0,
      depositAmount: 300.0,
      lateFeePerDay: 50.0,
      stockQty: 2,
    },
    {
      name: 'Scaffolding Set',
      description: 'Steel scaffolding 5m x 5m',
      rentalPricePerDay: 80.0,
      depositAmount: 200.0,
      lateFeePerDay: 30.0,
      stockQty: 10,
    }
  ]

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } })
    if (!existing) {
      await prisma.product.create({ data: product })
    }
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
