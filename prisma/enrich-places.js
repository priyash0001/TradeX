// Google Places API (New) Enrichment Script for TradeX MIDC Businesses
// Compliant with Google Maps Platform Terms of Service (stores only place_id)
// Uses Google Places API (New) Text Search
const fs = require('fs');
const path = require('path');

// Parse .env manually if needed
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
} catch (e) {}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const DISTRICT_CENTERS = {
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Mumbai/Thane/Raigad': { lat: 19.0760, lng: 72.8777 },
  'Chhatrapati Sambhajinagar': { lat: 19.8762, lng: 75.3433 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Kolhapur': { lat: 16.7050, lng: 74.2433 },
  'Nashik': { lat: 19.9975, lng: 73.7898 },
  'Amravati': { lat: 20.9320, lng: 77.7530 },
  'Solapur': { lat: 17.6599, lng: 75.9064 },
  'Latur': { lat: 18.4060, lng: 76.5640 },
  'Satara': { lat: 17.6860, lng: 74.0020 },
  'Sangli': { lat: 16.8524, lng: 74.5815 },
  'Jalgaon': { lat: 21.0050, lng: 75.5680 },
  'Dhule': { lat: 20.9000, lng: 74.7750 },
  'Ratnagiri': { lat: 17.0200, lng: 73.5500 },
};

async function textSearchPlace(query, center) {
  if (!API_KEY) {
    console.warn('⚠️ GOOGLE_MAPS_API_KEY missing in environment. Skipping API calls.');
    return null;
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 3,
      locationBias: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: 40000.0,
        },
      },
    }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return (data.places && data.places.length > 0) ? data.places[0] : null;
}

async function enrichMidcBusinesses() {
  console.log('🔍 Starting Google Places API (New) Enrichment Job for TradeX MIDC Records...');

  const businesses = await prisma.midcBusiness.findMany({
    where: { placeId: null },
    take: 15, // Enrich in controlled batches
  });

  console.log(`Found ${businesses.length} MIDC businesses pending Google Places matching.`);

  let enrichedCount = 0;
  for (const b of businesses) {
    const center = DISTRICT_CENTERS[b.district] || DISTRICT_CENTERS['Nashik'];
    const query = `${b.companyName} ${b.midcArea} ${b.city || b.district}`;

    try {
      const match = await textSearchPlace(query, center);
      if (match && match.id) {
        await prisma.midcBusiness.update({
          where: { id: b.id },
          data: {
            placeId: match.id,
            verificationStatus: 'GOOGLE_VERIFIED',
          },
        });
        enrichedCount++;
        console.log(`  ✓ Matched: ${b.companyName} -> Place ID: ${match.id}`);
      } else {
        console.log(`  - No direct Places match: ${b.companyName}`);
      }
    } catch (err) {
      console.warn(`  ✕ Error enriching ${b.companyName}:`, err.message);
    }
  }

  console.log(`\n✨ Batch Enrichment completed: ${enrichedCount} / ${businesses.length} updated with place_id.`);
}

enrichMidcBusinesses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
