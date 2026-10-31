import { prisma } from '@/lib/prisma';
import { mapMidcToTradeXSupplier, getMidcBusinesses, TradeXMidcSupplier } from '@/lib/midc-pipeline';
import { getRegionCenter } from '@/lib/india-geography';
import type { IndustrialCompany, IndustrialArea } from '@prisma/client';

export interface IndustrialFilterOptions {
  q?: string;
  state?: string;
  city?: string;
  district?: string;
  industrialArea?: string;
  midcArea?: string;
  industry?: string;
  businessType?: string;
  category?: string;
  south?: number;
  west?: number;
  north?: number;
  east?: number;
  take?: number;
  skip?: number;
}

export type TradeXIndustrialSupplier = TradeXMidcSupplier & {
  industrialArea?: string;
  industrialAuthority?: string;
  category?: string;
  sourceUrl?: string | null;
};

type CompanyWithArea = IndustrialCompany & { industrialArea?: IndustrialArea | null };

export function mapIndustrialToTradeXSupplier(item: CompanyWithArea): TradeXIndustrialSupplier {
  const areaName = item.industrialAreaName || item.industrialArea?.name || '';
  const authority = item.industrialAuthority || item.industrialArea?.authority || '';
  const role = item.businessType || 'VENDOR';
  const center = getRegionCenter(item.state);

  const rawProducts = item.products
    ? item.products.split(',').map((p) => p.trim()).filter(Boolean)
    : [];

  const formattedProducts = rawProducts.map((pName, idx) => ({
    id: `ind-prod-${item.id}-${idx}`,
    name: pName,
    minOrderQuantity: role === 'MANUFACTURER' ? 100 : 10,
    unit: 'units',
    indicativePrice: null,
    isAvailable: true,
    category: { name: item.category || item.industry || 'Engineering & Manufacturing' },
  }));

  const addressParts = [
    item.address,
    areaName,
    item.city,
    item.state,
    item.pincode,
  ].filter(Boolean);

  return {
    id: `ind-${item.id}`,
    placeId: item.placeId || `ind-${item.id}`,
    averageRating: 0,
    totalRatings: 0,
    isVerified:
      item.verificationStatus === 'VERIFIED' ||
      item.verificationStatus === 'GOVT_RECORD' ||
      item.verificationStatus === 'GOOGLE_VERIFIED',
    city: item.city,
    state: item.state,
    address: addressParts.join(', '),
    latitude: item.latitude ?? center.lat,
    longitude: item.longitude ?? center.lng,
    phone: item.phone || undefined,
    website: item.website || undefined,
    description: `${item.companyName} is an industrial ${String(item.businessType).toLowerCase()} in ${areaName || item.city}, ${item.state}${item.industry ? ` (${item.industry})` : ''}. Source: ${item.source || 'Industrial directory'}.`,
    user: {
      id: `ind-user-${item.id}`,
      name: item.companyName,
      companyName: item.companyName,
      role,
      location: [areaName, item.city, item.state].filter(Boolean).join(', '),
      email: item.email || '',
      mobile: item.phone || '',
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    },
    products: formattedProducts,
    district: item.district || item.city,
    midcArea: areaName,
    industrialArea: areaName,
    industrialAuthority: authority,
    plotAddress: item.address,
    industry: item.industry,
    category: item.category,
    source: item.source,
    sourceUrl: item.sourceUrl,
    verificationStatus: item.verificationStatus,
    businessType: item.businessType,
  };
}

function buildCompanyWhere(options: IndustrialFilterOptions) {
  const {
    q,
    state,
    city,
    district,
    industrialArea,
    midcArea,
    industry,
    businessType,
    category,
    south,
    west,
    north,
    east,
  } = options;

  const areaName = industrialArea || midcArea;
  const whereConditions: Record<string, unknown>[] = [];

  if (state) whereConditions.push({ state: { equals: state } });
  if (city) whereConditions.push({ city: { contains: city } });
  if (district) whereConditions.push({ district: { contains: district } });
  if (areaName) whereConditions.push({ industrialAreaName: { contains: areaName } });
  if (industry) whereConditions.push({ industry: { contains: industry } });
  if (businessType) whereConditions.push({ businessType: { equals: businessType } });
  if (category) whereConditions.push({ category: { contains: category } });

  if ([south, west, north, east].every((n) => typeof n === 'number' && Number.isFinite(n))) {
    whereConditions.push({
      latitude: { gte: south as number, lte: north as number },
      longitude: { gte: west as number, lte: east as number },
    });
  }

  if (q && q.trim()) {
    const searchTerm = q.trim();
    const terms = searchTerm.split(/\s+/).filter((t) => t.length > 1);
    const fields = (term: string) => [
      { companyName: { contains: term } },
      { products: { contains: term } },
      { industry: { contains: term } },
      { category: { contains: term } },
      { city: { contains: term } },
      { state: { contains: term } },
      { industrialAreaName: { contains: term } },
      { address: { contains: term } },
    ];
    whereConditions.push({
      OR: terms.flatMap((term) => fields(term)),
    });
  }

  return whereConditions.length > 0 ? { AND: whereConditions } : {};
}

export async function getIndustrialCompanies(options: IndustrialFilterOptions = {}) {
  const take = Math.min(Math.max(options.take ?? 80, 1), 400);
  const skip = Math.max(options.skip ?? 0, 0);

  const items = await prisma.industrialCompany.findMany({
    where: buildCompanyWhere(options),
    include: { industrialArea: true },
    orderBy: [{ state: 'asc' }, { companyName: 'asc' }],
    take,
    skip,
  });

  return items.map(mapIndustrialToTradeXSupplier);
}

export async function countIndustrialCompanies(options: IndustrialFilterOptions = {}) {
  return prisma.industrialCompany.count({ where: buildCompanyWhere(options) });
}

export async function getDirectoryLocations(state?: string, city?: string) {
  const isAllIndia = !state;
  const isMaharashtra = state === 'Maharashtra';
  const isNonMaharashtra = !state || state !== 'Maharashtra';

  const areaWhere: Record<string, unknown> = {};
  if (state && state !== 'Maharashtra') areaWhere.state = state;
  if (city) {
    areaWhere.OR = [
      { city: { contains: city } },
      { district: { contains: city } },
    ];
  }

  const [dbAreas, dbCities, dbCompanyCities, mhBusinesses, mhDistricts] = await Promise.all([
    isNonMaharashtra
      ? prisma.industrialArea.findMany({
          where: areaWhere,
          orderBy: [{ state: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            areaType: true,
            authority: true,
            city: true,
            district: true,
            state: true,
          },
        })
      : Promise.resolve([]),
    isNonMaharashtra
      ? prisma.industrialArea.findMany({
          where: state && state !== 'Maharashtra' ? { state } : {},
          distinct: ['city'],
          select: { city: true, state: true, district: true },
          orderBy: { city: 'asc' },
        })
      : Promise.resolve([]),
    isNonMaharashtra
      ? prisma.industrialCompany.findMany({
          where: state && state !== 'Maharashtra' ? { state } : {},
          distinct: ['city'],
          select: { city: true, state: true, district: true },
          orderBy: { city: 'asc' },
        })
      : Promise.resolve([]),
    (isAllIndia || isMaharashtra)
      ? prisma.midcBusiness.findMany({
          where: city
            ? {
                OR: [
                  { city: { contains: city } },
                  { district: { contains: city } },
                ],
              }
            : {},
          distinct: ['midcArea'],
          select: { midcArea: true, city: true, district: true, state: true },
          orderBy: { midcArea: 'asc' },
        })
      : Promise.resolve([]),
    (isAllIndia || isMaharashtra)
      ? prisma.midcBusiness.findMany({
          distinct: ['district'],
          select: { district: true, state: true },
          orderBy: { district: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  const citySet = new Map<string, { city: string; state: string; district?: string }>();

  if (isAllIndia || isMaharashtra) {
    for (const d of mhDistricts) {
      if (d.district) {
        citySet.set(`Maharashtra::${d.district}`, { city: d.district, state: 'Maharashtra', district: d.district });
      }
    }
  }

  if (isNonMaharashtra) {
    for (const row of [...dbCities, ...dbCompanyCities]) {
      if (!row.city) continue;
      citySet.set(`${row.state}::${row.city}`, { city: row.city, state: row.state, district: row.district || row.city });
    }
  }

  const allAreas: Array<{
    id: string;
    name: string;
    areaType: string;
    authority: string;
    city: string;
    district: string;
    state: string;
  }> = [];

  if (isAllIndia || isMaharashtra) {
    for (const m of mhBusinesses) {
      if (m.midcArea) {
        allAreas.push({
          id: `mh-${m.midcArea}`,
          name: m.midcArea,
          areaType: 'MIDC',
          authority: 'MIDC',
          city: m.city,
          district: m.district,
          state: 'Maharashtra',
        });
      }
    }
  }

  if (isNonMaharashtra) {
    for (const a of dbAreas) {
      allAreas.push(a);
    }
  }

  return {
    industrialAreas: allAreas,
    cities: Array.from(citySet.values()),
  };
}

export async function getUnifiedDirectory(options: IndustrialFilterOptions = {}) {
  const state = options.state || '';
  const includeMaharashtra = !state || state === 'Maharashtra';
  const take = Math.min(Math.max(options.take ?? 80, 1), 400);

  const [midc, industrial] = await Promise.all([
    includeMaharashtra
      ? getMidcBusinesses({
          q: options.q,
          district: options.district,
          midcArea: options.midcArea || options.industrialArea,
          industry: options.industry,
          businessType: options.businessType,
          city: options.city,
          take,
        })
      : Promise.resolve([] as TradeXMidcSupplier[]),
    getIndustrialCompanies({ ...options, take }),
  ]);

  return { midc, industrial };
}

export { mapMidcToTradeXSupplier };
