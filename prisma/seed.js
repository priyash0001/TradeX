const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  'Metals & Alloys',
  'Textiles & Fabrics',
  'Chemicals & Polymers',
  'Electronics & Electrical',
  'Agricultural Products',
  'Machinery & Equipment',
  'Plastics & Rubber',
  'Paper & Packaging',
  'Food & Beverages',
  'Construction Materials',
  'Automotive Parts',
  'Furniture & Wood',
  'Pharmaceuticals',
  'Oil & Lubricants',
  'Glass & Ceramics',
];

async function main() {
  console.log('🌱 Seeding categories...');
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ ${name}`);
  }
  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
