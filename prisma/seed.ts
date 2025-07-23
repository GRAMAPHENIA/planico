import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default categories
  const categories = [
    { name: 'Work', color: '#3B82F6' },      // Blue
    { name: 'Personal', color: '#10B981' },   // Green
    { name: 'Exercise', color: '#F59E0B' },   // Orange
    { name: 'Study', color: '#8B5CF6' },      // Purple
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log('Default categories seeded successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })