import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const commonCategories = [
    'Food',
    'Entertainment',
    'Transportation',
    'Utilities',
    'Healthcare',
    'Education',
    'Clothing',
    'Travel',
    'Others'
  ];

  for (const name of commonCategories) {
    const exists = await prisma.category.findFirst({
      where: { name, userId: null }
    });
    if (!exists) {
      await prisma.category.create({
        data: { name, userId: null },
      });
    }
  }

  console.log('Seeded common categories');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
