import { PrismaClient, Role, OrderState } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays, startOfDay } from 'date-fns'

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
  const customer1 = await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'customer1@example.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  })

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'customer2@example.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  })

  // Seed Vendor
  await prisma.user.upsert({
    where: { email: 'vendor@rental.com' },
    update: {},
    create: {
      name: 'Vendor User',
      email: 'vendor@rental.com',
      passwordHash,
      role: Role.VENDOR,
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

  const dbProducts = []
  for (const product of products) {
    let existing = await prisma.product.findFirst({ where: { name: product.name } })
    if (!existing) {
      existing = await prisma.product.create({ data: product })
    }
    dbProducts.push(existing)
  }

  // Clear existing orders to avoid duplicates on re-seed
  await prisma.payment.deleteMany({})
  await prisma.rentalOrder.deleteMany({})

  const today = startOfDay(new Date())
  const p1 = dbProducts[0]
  const p2 = dbProducts[1]

  // Order 1: Active, due today
  await prisma.rentalOrder.create({
    data: {
      customerId: customer1.id,
      productId: p1.id,
      startDate: subDays(today, 2),
      endDate: today,
      state: OrderState.Active,
      totalAmount: p1.rentalPricePerDay * 2,
      depositAmount: p1.depositAmount,
      payments: {
        create: {
          amount: (p1.rentalPricePerDay * 2) + p1.depositAmount,
          method: 'CREDIT_CARD',
          status: 'Success'
        }
      }
    }
  })

  // Order 2: Active, genuinely overdue (due 3 days ago)
  await prisma.rentalOrder.create({
    data: {
      customerId: customer2.id,
      productId: p2.id,
      startDate: subDays(today, 5),
      endDate: subDays(today, 3),
      state: OrderState.Active,
      totalAmount: p2.rentalPricePerDay * 2,
      depositAmount: p2.depositAmount,
      payments: {
        create: {
          amount: (p2.rentalPricePerDay * 2) + p2.depositAmount,
          method: 'CREDIT_CARD',
          status: 'Success'
        }
      }
    }
  })

  // Order 3: Settled On-Time
  await prisma.rentalOrder.create({
    data: {
      customerId: customer1.id,
      productId: p1.id,
      startDate: subDays(today, 10),
      endDate: subDays(today, 8),
      state: OrderState.Settled,
      totalAmount: p1.rentalPricePerDay * 2,
      depositAmount: p1.depositAmount,
      depositRefunded: p1.depositAmount,
      penaltyAmount: 0,
      payments: {
        create: {
          amount: (p1.rentalPricePerDay * 2) + p1.depositAmount,
          method: 'CREDIT_CARD',
          status: 'Success'
        }
      }
    }
  })

  // Order 4: Settled with Penalty (was 2 days late)
  const penalty = p2.lateFeePerDay * 2
  await prisma.rentalOrder.create({
    data: {
      customerId: customer2.id,
      productId: p2.id,
      startDate: subDays(today, 20),
      endDate: subDays(today, 18),
      state: OrderState.Settled,
      totalAmount: p2.rentalPricePerDay * 2,
      depositAmount: p2.depositAmount,
      depositRefunded: Math.max(0, p2.depositAmount - penalty),
      penaltyAmount: penalty,
      payments: {
        create: {
          amount: (p2.rentalPricePerDay * 2) + p2.depositAmount,
          method: 'CREDIT_CARD',
          status: 'Success'
        }
      }
    }
  })

  // Also add Settings
  await prisma.systemSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global', lateFeeDefault: 20, gracePeriodHours: 24 }
  })

  console.log('Seed completed successfully with Demo Data')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
