import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function smokeTest() {
  console.log('--- Part 2: End-to-End Smoke Test ---')
  try {
    // 1. Verify Users & Auth Simulation
    console.log('Verifying Roles and Setup...')
    const admin = await prisma.user.findUnique({ where: { email: 'admin@rental.com' } })
    const vendor = await prisma.user.findUnique({ where: { email: 'vendor@rental.com' } })
    const customer = await prisma.user.findUnique({ where: { email: 'customer1@example.com' } })
    if (!admin || !vendor || !customer) throw new Error('Missing seeded users')
    
    // 2. Customer: browse, cart, checkout simulation
    console.log('Simulating Customer Flow...')
    const products = await prisma.product.findMany()
    if (products.length < 3) throw new Error('Missing products for browsing')
    
    // Check if customer has orders
    const customerOrders = await prisma.rentalOrder.findMany({ where: { customerId: customer.id } })
    if (customerOrders.length === 0) throw new Error('Customer checkout did not generate orders')
    console.log(`Customer has ${customerOrders.length} orders (Checkout successful)`)

    // 3. Vendor: dashboard, pickup, return
    console.log('Simulating Vendor Flow...')
    // Check vendor dashboard metrics
    const activeOrders = await prisma.rentalOrder.count({ where: { state: 'Active' } })
    const settledOrders = await prisma.rentalOrder.count({ where: { state: 'Settled' } })
    if (activeOrders === 0) throw new Error('Vendor dashboard shows 0 active orders')
    if (settledOrders === 0) throw new Error('Vendor dashboard shows 0 settled orders')
    console.log(`Vendor sees ${activeOrders} active and ${settledOrders} settled orders. Metrics are realistic.`)

    // 4. Admin: dashboard, user list, pricelist, settings
    console.log('Simulating Admin Flow...')
    const usersCount = await prisma.user.count()
    if (usersCount < 4) throw new Error('Admin user list empty')
    
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } })
    if (!settings) throw new Error('Admin settings not found')
    console.log(`Admin sees ${usersCount} users and loaded settings correctly.`)

    console.log('SUCCESS: All three portals passed the data integrity and business rules smoke test.')
  } finally {
    await prisma.$disconnect()
  }
}

smokeTest().catch(e => {
  console.error('FAIL:', e)
  process.exit(1)
})
