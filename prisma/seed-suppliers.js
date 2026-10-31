const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SUPPLIERS_DATA = [
  {
    name: 'Ramesh Patil',
    email: 'contact@godavariforging.com',
    mobile: '+919822011001',
    companyName: 'Godavari Forgings & Engineering Works',
    role: 'MANUFACTURER',
    location: 'Ambad MIDC, Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Plot W-18, Phase 2, MIDC Ambad, Nashik',
    pincode: '422010',
    gstNumber: '27AABCG1234F1Z1',
    established: 2008,
    employeeCount: '51-200',
    latitude: 19.9572,
    longitude: 73.7291,
    description: 'Specialized in precision hot-forged steel components, flanges, automotive gears, and high-strength industrial fasteners.',
    isVerified: true,
    averageRating: 4.8,
    totalRatings: 18,
    products: [
      { name: 'Forged Steel Flanges (ANSI B16.5)', minOrderQuantity: 50, unit: 'pcs', indicativePrice: 420, category: 'Metals & Alloys' },
      { name: 'High Tensile M12-M24 Studs & Bolts', minOrderQuantity: 500, unit: 'pcs', indicativePrice: 14, category: 'Metals & Alloys' },
      { name: 'Automotive Transmission Gears', minOrderQuantity: 100, unit: 'pcs', indicativePrice: 850, category: 'Automotive Parts' }
    ]
  },
  {
    name: 'Suresh Deshmukh',
    email: 'info@satpuraplastics.com',
    mobile: '+919822011002',
    companyName: 'Satpura Polymers & Moulding Industries',
    role: 'MANUFACTURER',
    location: 'Satpur MIDC, Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'B-44, Trimbak Road, MIDC Satpur, Nashik',
    pincode: '422007',
    gstNumber: '27AABCS5678K1Z5',
    established: 2012,
    employeeCount: '11-50',
    latitude: 19.9984,
    longitude: 73.7431,
    description: 'Custom plastic injection moulding, packaging containers, industrial carboys, and engineering polymer components.',
    isVerified: true,
    averageRating: 4.6,
    totalRatings: 12,
    products: [
      { name: '50L HDPE Chemical Drums', minOrderQuantity: 100, unit: 'units', indicativePrice: 280, category: 'Plastics & Rubber' },
      { name: 'PP Injection Moulded Industrial Crates', minOrderQuantity: 200, unit: 'units', indicativePrice: 190, category: 'Paper & Packaging' }
    ]
  },
  {
    name: 'Anand Shinde',
    email: 'sales@sinnarchem.in',
    mobile: '+919822011003',
    companyName: 'Sinnar Agro-Chemicals & Fertilizers',
    role: 'MANUFACTURER',
    location: 'Sinnar MIDC, Nashik',
    city: 'Sinnar',
    state: 'Maharashtra',
    address: 'M-12, Musalgaon Industrial Area, Sinnar, Nashik',
    pincode: '422112',
    gstNumber: '27AABCS9999J1Z9',
    established: 2015,
    employeeCount: '11-50',
    latitude: 19.8492,
    longitude: 73.9871,
    description: 'Formulator and bulk manufacturer of agricultural micronutrients, bio-fertilizers, and industrial wetting agents.',
    isVerified: true,
    averageRating: 4.5,
    totalRatings: 9,
    products: [
      { name: 'Chelated Zinc Micronutrient (Bulk)', minOrderQuantity: 500, unit: 'kg', indicativePrice: 125, category: 'Chemicals & Polymers' },
      { name: 'Organic Humic Acid Liquid 12%', minOrderQuantity: 200, unit: 'litres', indicativePrice: 85, category: 'Agricultural Products' }
    ]
  },
  {
    name: 'Mahesh Kulkarni',
    email: 'trade@panchavatitools.com',
    mobile: '+919822011004',
    companyName: 'Panchavati Tooling & CNC Spares',
    role: 'VENDOR',
    location: 'Panchavati, Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Shop 14, Trade Center, Panchavati, Nashik',
    pincode: '422003',
    gstNumber: '27AABCP1122D1Z3',
    established: 2018,
    employeeCount: '1-10',
    latitude: 20.0125,
    longitude: 73.7995,
    description: 'Wholesale authorized vendor for carbide cutting tools, CNC toolholders, end mills, and precision measuring instruments.',
    isVerified: true,
    averageRating: 4.7,
    totalRatings: 24,
    products: [
      { name: 'Tungsten Carbide Inserts (CNMG 120408)', minOrderQuantity: 50, unit: 'pcs', indicativePrice: 160, category: 'Machinery & Equipment' },
      { name: 'Solid Carbide 4-Flute End Mills 10mm', minOrderQuantity: 10, unit: 'pcs', indicativePrice: 480, category: 'Machinery & Equipment' }
    ]
  },
  {
    name: 'Vikram Joshi',
    email: 'contact@sahaydrielectricals.com',
    mobile: '+919822011005',
    companyName: 'Sahyadri Electricals & Switchgear',
    role: 'VENDOR',
    location: 'Nashik Road, Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Opp. Railway Station, Nashik Road, Nashik',
    pincode: '422101',
    gstNumber: '27AABCS3344E1Z7',
    established: 2010,
    employeeCount: '11-50',
    latitude: 19.9554,
    longitude: 73.8415,
    description: 'Industrial electrical distributor for heavy switchgear, copper busbars, armored XLPE cables, and motor control panels.',
    isVerified: true,
    averageRating: 4.4,
    totalRatings: 15,
    products: [
      { name: '4-Core 16 sq mm Armored Copper Cable', minOrderQuantity: 100, unit: 'meters', indicativePrice: 310, category: 'Electronics & Electrical' },
      { name: 'Schneider 32A 3-Pole MCB C-Curve', minOrderQuantity: 20, unit: 'pcs', indicativePrice: 620, category: 'Electronics & Electrical' }
    ]
  },
  {
    name: 'Pooja Agarwal',
    email: 'orders@marathwadapaper.com',
    mobile: '+919822011006',
    companyName: 'Marathwada Corrugation & Packaging',
    role: 'MANUFACTURER',
    location: 'Ambad MIDC, Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'C-7, Ambad Link Road, Nashik',
    pincode: '422010',
    gstNumber: '27AABCM7788P1Z2',
    established: 2016,
    employeeCount: '11-50',
    latitude: 19.9650,
    longitude: 73.7380,
    description: '3-ply, 5-ply, and 7-ply heavy-duty corrugated export boxes, duplex board cartons, and custom printing services.',
    isVerified: true,
    averageRating: 4.9,
    totalRatings: 31,
    products: [
      { name: '5-Ply Heavy Duty Master Cartons (18x12x12)', minOrderQuantity: 500, unit: 'boxes', indicativePrice: 42, category: 'Paper & Packaging' },
      { name: 'Eco-Friendly Honeycomb Paper Pallets', minOrderQuantity: 100, unit: 'units', indicativePrice: 380, category: 'Paper & Packaging' }
    ]
  }
];

async function seedSuppliers() {
  console.log('🏭 Seeding realistic Nashik Manufacturers & Vendors into TradeX...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Load existing categories
  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.name, c.id]));

  for (const item of SUPPLIERS_DATA) {
    // 1. Create or Update User
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        companyName: item.companyName,
        role: item.role,
        mobile: item.mobile,
        location: item.location,
      },
      create: {
        name: item.name,
        email: item.email,
        mobile: item.mobile,
        password: passwordHash,
        role: item.role,
        companyName: item.companyName,
        location: item.location,
      },
    });

    // 2. Create or Update Supplier Profile
    const profile = await prisma.supplierProfile.upsert({
      where: { userId: user.id },
      update: {
        description: item.description,
        address: item.address,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        gstNumber: item.gstNumber,
        established: item.established,
        employeeCount: item.employeeCount,
        latitude: item.latitude,
        longitude: item.longitude,
        isVerified: item.isVerified,
        averageRating: item.averageRating,
        totalRatings: item.totalRatings,
      },
      create: {
        userId: user.id,
        description: item.description,
        address: item.address,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        gstNumber: item.gstNumber,
        established: item.established,
        employeeCount: item.employeeCount,
        latitude: item.latitude,
        longitude: item.longitude,
        isVerified: item.isVerified,
        averageRating: item.averageRating,
        totalRatings: item.totalRatings,
      },
    });

    // 3. Create or Update Products
    for (const prod of item.products) {
      const categoryId = catMap.get(prod.category) || null;
      const existingProduct = await prisma.product.findFirst({
        where: { supplierId: profile.id, name: prod.name },
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            supplierId: profile.id,
            name: prod.name,
            minOrderQuantity: prod.minOrderQuantity,
            unit: prod.unit,
            indicativePrice: prod.indicativePrice,
            categoryId: categoryId,
            isAvailable: true,
          },
        });
      }
    }

    console.log(`  ✓ ${item.role}: ${item.companyName} (${item.city}) [📍 ${item.latitude}, ${item.longitude}]`);
  }

  console.log('\n🎉 Successfully populated TradeX with local manufacturers and vendors!');
}

seedSuppliers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
