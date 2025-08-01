import { PrismaClient } from '@prisma/client'
import { getDefaultCategories } from '../src/lib/utils'

const prisma = new PrismaClient()

async function main() {
  // Create default categories
  const categories = getDefaultCategories()

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { color: category.color },
      create: category,
    })
  }

  console.log('Categorías por defecto creadas exitosamente')
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