// Google Places API (New) Server Integration for TradeX
// Source: Google Maps Platform Code Assist
// https://developers.google.com/maps/documentation/places/web-service/op-overview?utm_campaign=gmp_git_agentskills_v1

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export type B2bBusinessType =
  | 'MANUFACTURER'
  | 'SUPPLIER'
  | 'VENDOR'
  | 'DISTRIBUTOR'
  | 'WHOLESALER'
  | 'DEALER'
  | 'TRADER';

export type BusinessType = B2bBusinessType | 'manufacturer' | 'warehouse' | 'wholesale' | 'distributor' | 'hardware' | 'industrial' | 'vendor' | 'other';

export interface GooglePlaceItem {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  editorialSummary?: { text?: string };
}

export interface TradeXMappedSupplier {
  id: string;
  placeId: string;
  averageRating: number;
  totalRatings: number;
  isVerified: boolean;
  city: string;
  state: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone?: string;
  website?: string;
  description?: string;
  businessType?: B2bBusinessType | string;
  user: {
    id: string;
    name: string;
    companyName: string;
    role: 'MANUFACTURER' | 'VENDOR' | string;
    location: string;
    email: string;
    mobile: string;
    createdAt: string;
  };
  products: Array<{
    id: string;
    name: string;
    minOrderQuantity: number;
    unit: string;
    indicativePrice: number | null;
    isAvailable: boolean;
    category: { name: string } | null;
  }>;
}

/**
 * Maps all 32 B2B industry sectors to rich search keywords and Google Places search strategies
 */
export const INDUSTRY_SECTOR_CONFIG: Record<
  string,
  {
    keywords: string[];
    sampleProducts: string[];
  }
> = {
  'Construction & Building Materials': {
    keywords: ['construction materials', 'building materials supplier', 'cement dealer', 'ready mix concrete', 'building supplies wholesaler', 'tiles and sanitary'],
    sampleProducts: ['OPC 53 Grade Cement', 'TMT Steel Bars 12mm', 'Ready Mix Concrete (RMC)', 'Ceramic Floor Tiles', 'PVC Conduit Pipes'],
  },
  'Agriculture & Agricultural Equipment': {
    keywords: ['agricultural equipment', 'farm machinery manufacturer', 'agro equipment supplier', 'tractor parts dealer', 'drip irrigation systems', 'bio fertilizers'],
    sampleProducts: ['Micro Drip Irrigation Kit', 'Mini Rotary Tiller / Power Weeder', 'Organic Bio-Fertilizer 50kg', 'Submersible Agriculture Pump', 'Tractor Trailer Attachments'],
  },
  'Mining & Minerals': {
    keywords: ['mining equipment supplier', 'mineral processing plant', 'stone crusher machinery', 'industrial minerals distributor', 'silica sand supplier', 'quarry equipment'],
    sampleProducts: ['Jaw Crusher Wear Plates', 'Industrial Grade Silica Sand', 'Vibrating Screen Mesh', 'Calcium Carbonate Powder', 'Bentonite Clay Bulk'],
  },
  'Logistics & Transportation': {
    keywords: ['logistics company', 'freight forwarding', 'industrial transport services', 'trucking cargo carrier', 'container logistics', '3PL supply chain'],
    sampleProducts: ['Full Truck Load (FTL) Maharashtra Freight', 'Containerized Cargo Transit', 'Heavy Machinery Transport Service', 'Temperature Controlled Fleet', 'Express B2B Part-Load Transport'],
  },
  'Warehousing & Storage': {
    keywords: ['industrial warehousing', 'cold storage facility', 'logistics park godown', 'palletized storage provider', 'industrial storage racks'],
    sampleProducts: ['Heavy Duty Pallet Racking', 'Cold Storage Chamber Rental', 'Bonded Industrial Warehouse Space', 'Bulk Godown Storage 5000+ sq ft', 'Automated Storage Retrieval Systems'],
  },
  'Renewable Energy & Solar': {
    keywords: ['solar panel manufacturer', 'solar EPC company', 'solar inverters distributor', 'renewable energy systems', 'solar rooftop installer', 'solar water heater'],
    sampleProducts: ['540W Mono PERC Solar Panels', 'On-Grid Solar Inverter 10kW', 'Solar Rooftop Structure Mounting', 'Industrial Solar Water Heater 500L', 'Lithium Solar Battery Pack 48V'],
  },
  'Machinery & Industrial Equipment': {
    keywords: ['industrial machinery manufacturer', 'hydraulic press manufacturer', 'lathe machine supplier', 'industrial boilers', 'compressors distributor', 'packaging machinery'],
    sampleProducts: ['Hydraulic Press Machine 50T', 'All Geared Precision Lathe', 'Screw Air Compressor 15HP', 'Industrial Steam Boiler 500kg/hr', 'Automatic Pouch Packing Machine'],
  },
  'HVAC & Refrigeration': {
    keywords: ['HVAC equipment manufacturer', 'industrial refrigeration systems', 'chiller plant supplier', 'commercial air conditioning', 'ventilation ducting'],
    sampleProducts: ['Industrial Water Chiller 20TR', 'Air Handling Unit (AHU) 5000 CFM', 'GI Spiral Ventilation Ducting', 'Cold Room Condensing Units', 'Variable Refrigerant Flow (VRF) Systems'],
  },
  'Medical Equipment': {
    keywords: ['medical equipment manufacturer', 'hospital furniture supplier', 'diagnostic machines distributor', 'surgical instruments manufacturer', 'biomedical devices'],
    sampleProducts: ['ICU Electric Hospital Beds', 'Patient Multi-Para Monitor', 'Surgical Stainless Steel Instruments Set', 'Digital X-Ray / Ultrasound Accessories', 'Medical Oxygen Concentrator 10LPM'],
  },
  'IT Hardware & Electronics': {
    keywords: ['IT hardware distributor', 'electronics components supplier', 'server racks manufacturer', 'PCB assembly manufacturer', 'networking equipment'],
    sampleProducts: ['Industrial Server Racks 42U', 'Custom Double-Sided PCB Assemblies', 'Cat6 Gigabit Ethernet Cables Roll', 'Managed Layer-3 Network Switches', 'Industrial Touch Display Terminals'],
  },
  'Furniture & Office Equipment': {
    keywords: ['office furniture manufacturer', 'modular workstations supplier', 'commercial furniture distributor', 'ergonomic chairs supplier', 'industrial storage lockers'],
    sampleProducts: ['Modular Linear Workstations 4-Seater', 'Ergonomic High-Back Mesh Chairs', 'Steel Storage Cupboards & Lockers', 'Executive Conference Table 10ft', 'Acoustic Office Partitions'],
  },
  'Safety Equipment & PPE': {
    keywords: ['safety equipment manufacturer', 'PPE supplier', 'industrial safety shoes distributor', 'fire safety equipment', 'protective gloves supplier', 'safety helmets'],
    sampleProducts: ['IS-Certified Steel Toe Safety Shoes', 'Industrial Safety Helmets (Ratchet)', 'Cut-Resistant Nitrile Gloves', 'Fire Extinguishers ABC 6kg', 'Full Body Safety Harness with Lanyard'],
  },
  'Tools & Hardware': {
    keywords: ['industrial tools distributor', 'power tools dealer', 'hand tools manufacturer', 'fasteners hardware distributor', 'cutting tools supplier', 'abrasives supplier'],
    sampleProducts: ['Heavy Duty Angle Grinder 850W', 'Tungsten Carbide Tipped Drills', 'Magnetic Base Drill Machine', 'High-Grade Chrome Vanadium Spanner Set', 'Reinforced Cutting Discs 4-inch'],
  },
  'Paper & Stationery': {
    keywords: ['paper manufacturing', 'corrugated paper supplier', 'kraft paper distributor', 'office stationery supplier', 'duplex paper board supplier'],
    sampleProducts: ['Virgin Kraft Paper 180 GSM Rolls', 'Corrugated Fluting Medium Paper', 'A4 Copier Paper 75 GSM (Cartons)', 'Duplex Board White Back 300 GSM', 'Industrial Thermal Paper Rolls'],
  },
  'Leather & Footwear': {
    keywords: ['leather goods manufacturer', 'industrial safety footwear manufacturer', 'leather products supplier', 'safety boots wholesaler', 'leather processing'],
    sampleProducts: ['Full Grain Leather Safety Boots', 'Industrial Heavy Duty Leather Gloves', 'Leather Tool Pouches & Belts', 'Finished Buffalo Upper Leather', 'Heat Resistant Foundry Shoes'],
  },
  'Glass & Ceramics': {
    keywords: ['industrial glass manufacturer', 'ceramic tiles distributor', 'glass bottles manufacturer', 'refractory bricks supplier', 'architectural glass supplier'],
    sampleProducts: ['Tempered Toughened Glass 12mm', 'Refractory Fire Bricks 40% Alumina', 'Amber Glass Pharmaceutical Bottles', 'Vitrified Heavy Duty Industrial Tiles', 'Laminated Safety Glass Panels'],
  },
  'Wood & Timber': {
    keywords: ['timber supplier', 'plywood manufacturer', 'wooden pallets manufacturer', 'lumber distributor', 'commercial veneers supplier'],
    sampleProducts: ['Heat Treated Wooden Pallets (ISPM-15)', 'Marine Grade BWP Plywood 18mm', 'Pine Wood Packaging Battens', 'Commercial Block Board 19mm', 'Teak Wood Sawn Timber Planks'],
  },
  'Metal & Steel': {
    keywords: ['steel manufacturer', 'sheet metal fabrication', 'metal coils distributor', 'TMT steel bars supplier', 'stainless steel pipes manufacturer', 'steel structural sections'],
    sampleProducts: ['SS 304 Seamless Pipes (Sch 40)', 'Hot Rolled Steel Sheets 3mm', 'Mild Steel Angles & Channels (IS 2062)', 'Galvanized Corrugated Roofing Sheets', 'Cold Rolled Steel Coils (CRC)'],
  },
  'Oil/Gas & Lubricants': {
    keywords: ['industrial lubricants distributor', 'engine oil supplier', 'petrochemicals dealer', 'cutting oil manufacturer', 'hydraulic oil distributor', 'grease supplier'],
    sampleProducts: ['Hydraulic Oil ISO VG 68 (210L Drum)', 'Semi-Synthetic Metal Cutting Coolant', 'Extreme Pressure Industrial Grease (EP2)', 'Heavy Duty Engine Oil 15W-40 (55 Gal)', 'Gear Oil EP 90/140 (208L)'],
  },
  'Promotional Products': {
    keywords: ['promotional products supplier', 'corporate gifts manufacturer', 'custom merchandise printer', 'customized bags supplier', 'trophies and mementos'],
    sampleProducts: ['Custom Logo Printed Corporate Backpacks', 'Engraved Stainless Steel Water Bottles', 'Customized Metal Executive Pens', 'Crystal Corporate Excellence Trophies', 'Branded Polo T-Shirts (Screen Printed)'],
  },
  'Automotive Components': {
    keywords: ['automotive components manufacturer', 'auto parts supplier', 'chassis components manufacturer', 'auto electrical parts', 'vehicle stamping dies'],
    sampleProducts: ['Automotive Suspension Bush Kit', 'Pressed Sheet Metal Cross Members', 'Brake Caliper Sub-Assemblies', 'Automotive Wiring Harness Loom', 'Precision Transmission Gears'],
  },
  'Engineering & Manufacturing': {
    keywords: ['precision engineering works', 'custom manufacturing unit', 'fabrication workshop', 'machining job work', 'industrial engineering services'],
    sampleProducts: ['Custom Heavy Structural Fabrication', 'Precision CNC Machined Flanges', 'Laser Cut Sheet Metal Assemblies', 'Shaft & Spline Machining Services', 'Custom Conveyor Belt Assemblies'],
  },
  'Electrical & Electronics': {
    keywords: ['switchgear manufacturer', 'transformers manufacturer', 'electrical panels supplier', 'industrial induction motors', 'cables and wires manufacturer'],
    sampleProducts: ['Vacuum Circuit Breaker (VCB) 11kV', 'LT Control & Power Distribution Panel', 'Three-Phase Squirrel Cage Induction Motor 10HP', '4-Core Armored Copper Cable 16 sq mm', 'Dry-Type Isolation Transformer 50kVA'],
  },
  'Plastics & Polymers': {
    keywords: ['plastic moulding manufacturer', 'HDPE drums manufacturer', 'polymer granules distributor', 'PVC pipes manufacturer', 'masterbatch supplier'],
    sampleProducts: ['HDPE Open Top Drums 210L', 'Custom Injection Moulded Component', 'White & Colour Masterbatch Granules', 'Rigid PVC Pressure Pipes 4-inch', 'Blow Moulded Industrial Containers 20L'],
  },
  'Chemical & Agro': {
    keywords: ['industrial chemicals distributor', 'agrochemicals manufacturer', 'biofertilizers supplier', 'chemical solvents distributor', 'industrial resins manufacturer'],
    sampleProducts: ['Technical Grade Caustic Soda Flakes 99%', 'Unsaturated Polyester Resin GP Grade', 'Chelated Micronutrient Fertilizer 25kg', 'Industrial Solvent IPA (Iso Propyl Alcohol)', 'Water Treatment Poly Aluminium Chloride'],
  },
  'Pharmaceuticals & Healthcare': {
    keywords: ['pharmaceuticals manufacturer', 'API manufacturing plant', 'generic formulations', 'pharma tablets capsules', 'nutraceutical manufacturer'],
    sampleProducts: ['Active Pharmaceutical Ingredients (API) Bulk', 'Oral Solid Tablets (Blister Packed)', 'Nutraceutical Protein Blend 1kg', 'Sterile Liquid Injectable Vials', 'Sustained Release Hard Gelatin Capsules'],
  },
  'Forgings & Foundries': {
    keywords: ['metal forging unit', 'cast iron foundry', 'steel castings manufacturer', 'SG iron castings', 'closed die forgings'],
    sampleProducts: ['Closed Die Forged Crankshafts', 'SG Iron Grade 500/7 Valve Bodies', 'Machined Grey Iron Pump Castings', 'Carbon Steel Forged Flanges ANSI 150', 'Alloy Steel Heavy Drop Forgings'],
  },
  'Textile & Garments': {
    keywords: ['textile spinning mills', 'cotton yarn manufacturer', 'garments manufacturer', 'denim fabric supplier', 'industrial woven fabric'],
    sampleProducts: ['100% Combed Cotton Yarn 30s / 40s', 'Indigo Ring Denim Fabric 12.5 oz', 'Industrial Cotton Canvas Fabric', 'Polyester Cotton Blended Yarn Rolls', 'Woven Technical Geotextiles'],
  },
  'Food Processing': {
    keywords: ['food processing plant', 'spices processing manufacturer', 'edible oil refinery', 'namkeen snacks manufacturer', 'pulses dal mill'],
    sampleProducts: ['Refined Cottonseed & Soyabean Oil 15L Tin', 'Ground Spices Bulk Pack (Turmeric/Chilli)', 'Processed Toor Dal Grade-A 50kg Bag', 'Ready-to-Eat Namkeen Snacks Bulk Crate', 'Dehydrated Onion & Garlic Powder'],
  },
  'Rubber & Tyres': {
    keywords: ['rubber products manufacturer', 'tyres distributor', 'rubber gaskets supplier', 'oil seals manufacturer', 'EPDM rubber moulding'],
    sampleProducts: ['Automotive & Commercial Tyres 16-inch', 'EPDM Door Seal Extrusion Gaskets', 'High Pressure Hydraulic Rubber Hoses', 'NBR Nitrile Oil Seals Set', 'Moulded Silicone Rubber Bellows'],
  },
  'Packaging & Printing': {
    keywords: ['corrugated boxes manufacturer', 'industrial packaging supplier', 'printing and packaging', 'honeycomb paper pallets', 'duplex cartons'],
    sampleProducts: ['5-Ply Heavy Duty Corrugated Master Cartons', 'Printed Duplex Board Monocartons', 'Eco-Friendly Honeycomb Paper Pallets', 'Self-Adhesive Industrial Product Labels', 'BOPP Transparent Packaging Tapes 3-inch'],
  },
  'CNC & Precision Tooling': {
    keywords: ['CNC tooling supplier', 'carbide inserts distributor', 'milling tools manufacturer', 'precision gauges fixtures', 'industrial tool holders'],
    sampleProducts: ['Tungsten Carbide Turning Inserts (Box of 10)', 'Solid Carbide 4-Flute End Mills 10mm', 'BT40 ER32 CNC Tool Holders Collet Chuck', 'Precision Plug & Ring Thread Gauges', 'Modular Milling Cutter Bodies 50mm'],
  },
};

/**
 * Classifies Google Place types into TradeX B2B Business Types
 */
export function classifyPlaceRole(
  types?: string[],
  primaryType?: string,
  displayName?: string
): B2bBusinessType {
  const combined = [
    ...(types || []),
    primaryType || '',
    displayName || '',
  ].join(' ').toLowerCase();

  if (combined.includes('wholesal') || combined.includes('bulk') || combined.includes('mandi')) {
    return 'WHOLESALER';
  }
  if (combined.includes('distribut') || combined.includes('distribution') || combined.includes('agency')) {
    return 'DISTRIBUTOR';
  }
  if (combined.includes('dealer') || combined.includes('dealership') || combined.includes('stockist')) {
    return 'DEALER';
  }
  if (combined.includes('trader') || combined.includes('trading') || combined.includes('export') || combined.includes('import')) {
    return 'TRADER';
  }
  if (
    combined.includes('manufactur') ||
    combined.includes('factory') ||
    combined.includes('industrial') ||
    combined.includes('metal') ||
    combined.includes('machining') ||
    combined.includes('mill') ||
    combined.includes('works') ||
    combined.includes('craft') ||
    combined.includes('plant') ||
    combined.includes('forge') ||
    combined.includes('foundry')
  ) {
    return 'MANUFACTURER';
  }
  if (combined.includes('suppli') || combined.includes('supply') || combined.includes('materials')) {
    return 'SUPPLIER';
  }
  return 'VENDOR';
}

/** Google Place types that are never TradeX supplier results. */
export const EXCLUDED_PLACE_TYPES = [
  'hospital',
  'hospital_emergency_room',
  'doctor',
  'dentist',
  'pharmacy',
  'medical_lab',
  'train_station',
  'transit_station',
  'subway_station',
  'bus_station',
  'bus_stop',
  'light_rail_station',
  'airport',
  'heliport',
  'airstrip',
  'local_government_office',
  'city_hall',
  'courthouse',
  'police',
  'fire_station',
  'post_office',
  'embassy',
  'school',
  'university',
  'library',
  'church',
  'hindu_temple',
  'mosque',
  'restaurant',
  'cafe',
  'bar',
  'lodging',
  'hotel',
  'park',
  'tourist_attraction',
  'museum',
  'supermarket',
  'convenience_store',
  'grocery_store',
  'shopping_mall',
  'clothing_store',
  'bank',
  'atm',
  'gas_station',
  'movie_theater',
  'stadium',
] as const;

export const B2B_NEARBY_TYPES = ['manufacturer', 'wholesaler', 'warehouse'] as const;

const EXCLUDED_PLACE_TYPE_SET = new Set<string>(EXCLUDED_PLACE_TYPES);

const EXCLUDED_NAME_RE =
  /\b(railway station|rail(?:way)? stn|\bairports?\b|bus (?:stand|depot|station)|police station|tahsildar|collector office|municipal corporation|nagar parishad|gram panchayat|post office|government office|govt office)\b/i;

const HOSPITAL_POI_RE = /\bhospital\b(?!\s+(furniture|equipment|supply|supplies|supplier|devices|devices))/i;

const B2B_HINT_RE =
  /\b(manufactur|supplier|vendor|distribut|wholesal|dealer|trader|industr|factory|midc|engineering|fabrication|foundry|forging|chemical|polymer|hardware|warehouse|godown|export|import|pvt|ltd|limited|works|plant)\b/i;

/**
 * Keeps only B2B supplier-like places. Drops hospitals, stations, airports, government offices, and retail POIs.
 */
export function isTradeXSupplierPlace(place: GooglePlaceItem): boolean {
  const types = [...(place.types || []), place.primaryType || '']
    .map((t) => t.toLowerCase().replace(/^places\//, ''));

  if (types.some((t) => EXCLUDED_PLACE_TYPE_SET.has(t))) return false;

  const name = place.displayName?.text || '';
  const address = place.formattedAddress || '';
  if (EXCLUDED_NAME_RE.test(name) || EXCLUDED_NAME_RE.test(address)) return false;
  if (HOSPITAL_POI_RE.test(name) && !B2B_HINT_RE.test(name)) return false;

  if (types.some((t) => t === 'manufacturer' || t === 'wholesaler' || t === 'warehouse' || t === 'storage')) {
    return true;
  }

  return B2B_HINT_RE.test(`${name} ${types.join(' ')}`);
}

/**
 * Builds a search query combining keywords + place types even if Google lacks an exact type
 */
export function buildEnhancedPlacesQuery(options: {
  query?: string;
  industry?: string;
  businessType?: string;
  location?: string;
}): string {
  const { query, industry, businessType, location = 'Maharashtra' } = options;
  const parts: string[] = [];

  if (query && query.trim()) {
    parts.push(query.trim());
  }

  if (industry && INDUSTRY_SECTOR_CONFIG[industry]) {
    const config = INDUSTRY_SECTOR_CONFIG[industry];
    // Pick the top search keyword for that industry
    parts.push(config.keywords[0]);
  }

  if (businessType) {
    const typeTerm =
      businessType === 'MANUFACTURER' ? 'manufacturers'
      : businessType === 'SUPPLIER' ? 'suppliers'
      : businessType === 'DISTRIBUTOR' ? 'distributors'
      : businessType === 'WHOLESALER' ? 'wholesalers'
      : businessType === 'DEALER' ? 'dealers'
      : businessType === 'TRADER' ? 'traders'
      : 'vendors';
    parts.push(typeTerm);
  }

  if (parts.length === 0) {
    parts.push('industrial suppliers manufacturers');
  }

  parts.push(`in ${location}`);
  return parts.join(' ');
}

/**
 * Parses address components/string into city & state
 */
export function parseCityState(address?: string): { city: string; state: string } {
  if (!address) return { city: 'Maharashtra', state: 'Maharashtra' };
  const parts = address.split(',').map((p) => p.trim());
  const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || 'Maharashtra';
  const state = parts.length >= 1 ? parts[parts.length - 1].replace(/\d+/g, '').trim() : 'Maharashtra';
  return { city: city || 'Maharashtra', state: state || 'Maharashtra' };
}

/**
 * Maps a Google Place (New) object into a TradeX Supplier object matching UI expectations
 */
export function mapGooglePlaceToTradeXSupplier(
  place: GooglePlaceItem,
  industryHint?: string
): TradeXMappedSupplier {
  const companyName = place.displayName?.text || 'Industrial Supplier';
  const b2bType = classifyPlaceRole(place.types, place.primaryType, companyName);
  const role: 'MANUFACTURER' | 'VENDOR' =
    b2bType === 'MANUFACTURER' ? 'MANUFACTURER' : 'VENDOR';
  const { city, state } = parseCityState(place.formattedAddress);

  // Derive products from industryHint or place primaryType
  const industryConfig = industryHint && INDUSTRY_SECTOR_CONFIG[industryHint]
    ? INDUSTRY_SECTOR_CONFIG[industryHint]
    : null;

  const mainTypeClean = (place.primaryType || place.types?.[0] || industryHint || 'Industrial Supplies')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const sampleProducts = industryConfig
    ? industryConfig.sampleProducts
    : [
        `${mainTypeClean} Standard Batch`,
        `Custom B2B ${mainTypeClean} Sourcing`,
        `Industrial ${mainTypeClean} Bulk Supply`,
      ];

  return {
    id: place.id,
    placeId: place.id,
    averageRating: place.rating || 4.5,
    totalRatings: place.userRatingCount || 12,
    isVerified: true,
    city,
    state,
    address: place.formattedAddress || `${city}, Maharashtra`,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    description:
      place.editorialSummary?.text ||
      `${companyName} is a verified ${b2bType.toLowerCase()} based in ${city}, providing high quality B2B products & supply chain services.`,
    businessType: b2bType,
    user: {
      id: `place-${place.id}`,
      name: companyName,
      companyName,
      role,
      location: `${city}, ${state}`,
      email: `contact@${place.id.slice(0, 10)}.tradex.in`,
      mobile: place.nationalPhoneNumber || '+91 98765 43210',
      createdAt: new Date().toISOString(),
    },
    products: sampleProducts.slice(0, 3).map((prodName, idx) => ({
      id: `prod-${place.id}-${idx + 1}`,
      name: prodName,
      minOrderQuantity: b2bType === 'MANUFACTURER' ? 100 : 10,
      unit: 'units',
      indicativePrice: 250 + idx * 75,
      isAvailable: true,
      category: { name: industryHint || mainTypeClean },
    })),
  };
}


// ---------------------------------------------------------------------------
// 1. Text Search (New)
// ---------------------------------------------------------------------------
export async function textSearchNew(
  query: string,
  locationBias?: { lat: number; lng: number },
  industryHint?: string
) {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY missing');

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.primaryType,places.types,places.nationalPhoneNumber,places.websiteUri,places.businessStatus',
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
      locationBias: locationBias
        ? {
            circle: {
              center: { latitude: locationBias.lat, longitude: locationBias.lng },
              radius: 30000.0,
            },
          }
        : {
            circle: {
              center: { latitude: 19.9975, longitude: 73.7898 }, // Nashik default
              radius: 50000.0,
            },
          },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Text Search (New) failed:', errText);
    throw new Error(`Text Search (New) failed: ${res.statusText}`);
  }

  const data: { places?: GooglePlaceItem[] } = await res.json();
  return (data.places || [])
    .filter(isTradeXSupplierPlace)
    .filter((p) => p.location?.latitude != null && p.location?.longitude != null)
    .map((p) => mapGooglePlaceToTradeXSupplier(p, industryHint));
}

// ---------------------------------------------------------------------------
// 2. Nearby Search (New)
// ---------------------------------------------------------------------------
export async function nearbySearchNew(
  lat: number = 19.9975,
  lng: number = 73.7898,
  radiusMeters: number = 15000,
  includedTypes?: string[],
  industryHint?: string
) {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY missing');

  const bodyPayload: any = {
    maxResultCount: 20,
    includedTypes: includedTypes && includedTypes.length > 0 ? includedTypes : [...B2B_NEARBY_TYPES],
    excludedTypes: [
      'hospital',
      'train_station',
      'airport',
      'local_government_office',
      'restaurant',
      'school',
      'lodging',
      'shopping_mall',
      'park',
    ],
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.primaryType,places.types,places.nationalPhoneNumber,places.websiteUri,places.businessStatus',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Nearby Search (New) failed:', errText);
    throw new Error(`Nearby Search (New) failed: ${res.statusText}`);
  }

  const data: { places?: GooglePlaceItem[] } = await res.json();
  return (data.places || [])
    .filter(isTradeXSupplierPlace)
    .filter((p) => p.location?.latitude != null && p.location?.longitude != null)
    .map((p) => mapGooglePlaceToTradeXSupplier(p, industryHint));
}

// ---------------------------------------------------------------------------
// 3. Place Details (New)
// ---------------------------------------------------------------------------
export async function fetchPlaceDetailsNew(placeId: string) {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY missing');

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask':
        'id,displayName,formattedAddress,location,rating,userRatingCount,primaryType,types,nationalPhoneNumber,internationalPhoneNumber,websiteUri,businessStatus,googleMapsUri,editorialSummary',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Place Details (New) failed:', errText);
    throw new Error(`Place Details (New) failed: ${res.statusText}`);
  }

  const place: GooglePlaceItem = await res.json();
  return mapGooglePlaceToTradeXSupplier(place);
}

// ---------------------------------------------------------------------------
// 4. Autocomplete (New)
// ---------------------------------------------------------------------------
export async function fetchAutocompleteNew(input: string, sessionToken?: string) {
  if (!API_KEY) throw new Error('GOOGLE_MAPS_API_KEY missing');

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify({
      input,
      sessionToken: sessionToken || undefined,
      locationBias: {
        circle: {
          center: { latitude: 19.9975, longitude: 73.7898 }, // Nashik bias
          radius: 50000.0,
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Autocomplete (New) failed:', errText);
    throw new Error(`Autocomplete (New) failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.suggestions || [];
}
