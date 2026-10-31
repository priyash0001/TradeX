const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  const totalAreas = await prisma.industrialArea.count();
  const totalCompanies = await prisma.industrialCompany.count();
  const totalMidc = await prisma.midcBusiness.count();

  const states = await prisma.industrialCompany.findMany({
    select: { state: true },
    distinct: ['state'],
  });

  const stateCounts = await prisma.industrialCompany.groupBy({
    by: ['state'],
    _count: { id: true },
    orderBy: { state: 'asc' },
  });

  const industryCounts = await prisma.industrialCompany.groupBy({
    by: ['industry'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const businessTypes = await prisma.industrialCompany.groupBy({
    by: ['businessType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const uniqueAreaNames = await prisma.industrialArea.findMany({
    select: { name: true },
    distinct: ['name'],
  });

  console.log('=== AUDIT SUMMARY ===');
  console.log('Maharashtra MIDC Businesses:', totalMidc);
  console.log('All-India Industrial Areas (Total):', totalAreas);
  console.log('All-India Industrial Areas (Unique):', uniqueAreaNames.length);
  console.log('All-India Industrial Companies:', totalCompanies);
  console.log('Unique States & UTs in IndustrialCompany:', states.length);
  
  console.log('\n--- Companies by State/UT ---');
  stateCounts.forEach((s) => console.log(`  ${s.state.padEnd(45)}: ${s._count.id}`));
  
  console.log('\n--- Companies by Industry Sector ---');
  industryCounts.forEach((i) => console.log(`  ${i.industry.padEnd(40)}: ${i._count.id}`));

  console.log('\n--- Companies by Business Type ---');
  businessTypes.forEach((b) => console.log(`  ${b.businessType.padEnd(20)}: ${b._count.id}`));
}

audit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
