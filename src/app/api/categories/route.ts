import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let cachedCategories: any[] | null = null;
let categoriesExpiresAt = 0;
const CATEGORIES_TTL_MS = 10 * 60 * 1000; // 10 minutes

// GET all categories
export async function GET() {
  const now = Date.now();
  if (cachedCategories && categoriesExpiresAt > now) {
    return NextResponse.json(
      { categories: cachedCategories },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' } }
    );
  }

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  cachedCategories = categories;
  categoriesExpiresAt = now + CATEGORIES_TTL_MS;

  return NextResponse.json(
    { categories },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' } }
  );
}
