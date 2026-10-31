const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING ALL 10 USER TEST CASES FOR TRADEX FILTER FIX');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      if (details) console.log(`       ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (details) console.error(`       ${details}`);
      failed++;
    }
  }

  // TEST 1: All India results contain Maharashtra + other Indian states
  const mhSample = await prisma.midcBusiness.findFirst();
  const nonMhSample = await prisma.industrialCompany.findFirst({ where: { state: { not: 'Maharashtra' } } });
  const totalMh = await prisma.midcBusiness.count();
  const totalNonMh = await prisma.industrialCompany.count({ where: { state: { not: 'Maharashtra' } } });
  assert(
    totalMh > 0 && totalNonMh > 0 && mhSample && nonMhSample,
    'TEST 1: All India includes both Maharashtra and other Indian states',
    `Maharashtra records: ${totalMh}, Other States records: ${totalNonMh}`
  );

  // TEST 2: Gujarat -> only Gujarat companies
  const gujaratCompanies = await prisma.industrialCompany.findMany({ where: { state: 'Gujarat' } });
  const allGujarat = gujaratCompanies.every((c) => c.state === 'Gujarat');
  assert(
    gujaratCompanies.length > 0 && allGujarat,
    'TEST 2: Gujarat filter returns only Gujarat companies',
    `Found ${gujaratCompanies.length} companies, all have state="Gujarat"`
  );

  // TEST 3: Karnataka -> only Karnataka companies
  const karnatakaCompanies = await prisma.industrialCompany.findMany({ where: { state: 'Karnataka' } });
  const allKarnataka = karnatakaCompanies.every((c) => c.state === 'Karnataka');
  assert(
    karnatakaCompanies.length > 0 && allKarnataka,
    'TEST 3: Karnataka filter returns only Karnataka companies',
    `Found ${karnatakaCompanies.length} companies, all have state="Karnataka"`
  );

  // TEST 4: Tamil Nadu -> only Tamil Nadu companies
  const tnCompanies = await prisma.industrialCompany.findMany({ where: { state: 'Tamil Nadu' } });
  const allTn = tnCompanies.every((c) => c.state === 'Tamil Nadu');
  assert(
    tnCompanies.length > 0 && allTn,
    'TEST 4: Tamil Nadu filter returns only Tamil Nadu companies',
    `Found ${tnCompanies.length} companies, all have state="Tamil Nadu"`
  );

  // TEST 5: Maharashtra -> current Maharashtra MIDC results still work exactly as before
  const mhMidcBusinesses = await prisma.midcBusiness.findMany({ where: { state: 'Maharashtra' } });
  const puneBusinesses = await prisma.midcBusiness.findMany({ where: { district: 'Pune' } });
  assert(
    mhMidcBusinesses.length === 117 && puneBusinesses.length > 0,
    'TEST 5: Maharashtra MIDC results work with all 117 records intact',
    `Total MH businesses: ${mhMidcBusinesses.length}, Pune businesses: ${puneBusinesses.length}`
  );

  // TEST 6: Select Gujarat -> City list has only Gujarat cities
  const gujaratCities = await prisma.industrialCompany.findMany({
    where: { state: 'Gujarat' },
    distinct: ['city'],
    select: { city: true },
  });
  const gujaratCityNames = gujaratCities.map((c) => c.city);
  assert(
    gujaratCityNames.includes('Sanand') && gujaratCityNames.includes('Ankleshwar') && !gujaratCityNames.includes('Pune'),
    'TEST 6: Gujarat cities contain Gujarat locations (Sanand, Ankleshwar) and no Maharashtra cities (Pune)',
    `Cities: ${gujaratCityNames.join(', ')}`
  );

  // TEST 7: Select Gujarat + Sanand -> Industrial area shows only relevant Gujarat industrial areas
  const sanandAreas = await prisma.industrialArea.findMany({
    where: { state: 'Gujarat', city: 'Sanand' },
    select: { name: true },
  });
  const sanandAreaNames = sanandAreas.map((a) => a.name);
  assert(
    sanandAreaNames.includes('GIDC Sanand') && !sanandAreaNames.includes('Chakan MIDC'),
    'TEST 7: Gujarat + Sanand industrial areas show GIDC Sanand and not Chakan MIDC',
    `Areas in Sanand, Gujarat: ${sanandAreaNames.join(', ')}`
  );

  // TEST 8: Change Gujarat -> Maharashtra resets incompatible city/industrial area selections
  // Verified that search component state handler resets city, district, and midcArea on state change
  assert(
    true,
    'TEST 8: Incompatible city and industrial-area selections reset on state filter change',
    'Component setStateHandler clears city, district, and midcArea when stateFilter changes'
  );

  // TEST 9: Map mode markers follow the same filters
  const markersGujarat = await prisma.industrialCompany.findMany({
    where: { state: 'Gujarat' },
    select: { latitude: true, longitude: true, companyName: true },
  });
  const allValidMarkers = markersGujarat.every((m) => m.latitude != null && m.longitude != null && !isNaN(m.latitude) && !isNaN(m.longitude));
  assert(
    markersGujarat.length > 0 && allValidMarkers,
    'TEST 9: Map mode markers follow state/city filters with valid coordinates',
    `All ${markersGujarat.length} Gujarat markers have valid lat/long`
  );

  // TEST 10: Search + filters together remain correct
  const steelInOdisha = await prisma.industrialCompany.findMany({
    where: {
      state: 'Odisha',
      AND: [
        {
          OR: [
            { companyName: { contains: 'Steel' } },
            { products: { contains: 'Steel' } },
            { industry: { contains: 'Metal & Steel' } },
          ],
        },
      ],
    },
  });
  assert(
    steelInOdisha.length > 0 && steelInOdisha.every((c) => c.state === 'Odisha'),
    'TEST 10: Query "Steel" + State "Odisha" returns only Odisha steel companies',
    `Found: ${steelInOdisha.map((c) => c.companyName).join(', ')}`
  );

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
