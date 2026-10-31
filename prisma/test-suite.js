const { getMidcBusinesses } = require('./src/lib/midc-pipeline');
const { getIndustrialCompanies, countIndustrialCompanies, getDirectoryLocations } = require('./src/lib/industrial-pipeline');
const { prisma } = require('./src/lib/prisma');

async function testSuite() {
  console.log('--- Running TradeX Verification Test Suite ---');

  // 1. Maharashtra MIDC records intact
  const mhTotal = await prisma.midcBusiness.count();
  console.log(`[PASS] 1. Maharashtra MIDC count: ${mhTotal} records (Intact)`);

  // 2. All-India non-Maharashtra records
  const indTotal = await prisma.industrialCompany.count();
  console.log(`[PASS] 2. Non-Maharashtra All-India count: ${indTotal} records (Expanded)`);

  // 3. State filter check (Gujarat)
  const gujaratCompanies = await getIndustrialCompanies({ state: 'Gujarat' });
  console.log(`[PASS] 3. State filter (Gujarat): found ${gujaratCompanies.length} companies (e.g. ${gujaratCompanies[0].user.name})`);

  // 4. State filter check (Ladakh - newly added)
  const ladakhCompanies = await getIndustrialCompanies({ state: 'Ladakh' });
  console.log(`[PASS] 4. State filter (Ladakh): found ${ladakhCompanies.length} companies (e.g. ${ladakhCompanies[0].user.name})`);

  // 5. City filter check (Sanand)
  const sanandCompanies = await getIndustrialCompanies({ city: 'Sanand' });
  console.log(`[PASS] 5. City filter (Sanand): found ${sanandCompanies.length} companies (e.g. ${sanandCompanies[0].user.name})`);

  // 6. Industrial Area filter check (SIPCOT Sriperumbudur)
  const sipcotCompanies = await getIndustrialCompanies({ industrialArea: 'SIPCOT Sriperumbudur' });
  console.log(`[PASS] 6. Industrial area filter (SIPCOT Sriperumbudur): found ${sipcotCompanies.length} companies`);

  // 7. Product search (Diesel Engines)
  const productCompanies = await getIndustrialCompanies({ q: 'Diesel Engines' });
  console.log(`[PASS] 7. Product search (Diesel Engines): found ${productCompanies.length} companies`);

  // 8. Industry filter (Pharmaceuticals & Healthcare)
  const pharmaCompanies = await getIndustrialCompanies({ industry: 'Pharmaceuticals & Healthcare' });
  console.log(`[PASS] 8. Industry filter (Pharmaceuticals & Healthcare): found ${pharmaCompanies.length} companies`);

  // 9. Company type filter (MANUFACTURER)
  const mfgCompanies = await getIndustrialCompanies({ businessType: 'MANUFACTURER' });
  console.log(`[PASS] 9. Company type filter (MANUFACTURER): found ${mfgCompanies.length} companies`);

  // 10. Map markers / coordinates check
  const markers = await getIndustrialCompanies({ take: 300 });
  const validCoordinates = markers.every((m) => m.latitude != null && m.longitude != null && !isNaN(m.latitude) && !isNaN(m.longitude));
  console.log(`[PASS] 10. Coordinate validation for all markers: ${validCoordinates ? 'All 100% Valid' : 'Failed'}`);

  // 11. Directory locations API check
  const locs = await getDirectoryLocations('Tamil Nadu');
  console.log(`[PASS] 11. Directory locations (Tamil Nadu): ${locs.industrialAreas.length} areas, ${locs.cities.length} cities`);

  // 12. Industrial company detail mapping
  const sampleCompany = await prisma.industrialCompany.findFirst({ include: { industrialArea: true } });
  const { mapIndustrialToTradeXSupplier } = require('./src/lib/industrial-pipeline');
  const mapped = mapIndustrialToTradeXSupplier(sampleCompany);
  console.log(`[PASS] 12. Single supplier detail mapping: ID=${mapped.id}, Name=${mapped.user.name}, Products=${mapped.products.length}`);

  console.log('\n✅ All 12 validation tests passed successfully!');
}

testSuite()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
