import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST: Rate a supplier
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'BUYER') return NextResponse.json({ error: 'Only buyers can rate suppliers' }, { status: 403 });

  const { supplierId, score, comment } = await req.json();

  if (!supplierId || !score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'Supplier ID and score (1-5) are required' }, { status: 400 });
  }

  const supplier = await prisma.user.findUnique({ where: { id: supplierId } });
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

  // Upsert rating
  const rating = await prisma.rating.upsert({
    where: { buyerId_supplierId: { buyerId: user.userId, supplierId } },
    update: { score, comment: comment || '' },
    create: { buyerId: user.userId, supplierId, score, comment: comment || '' },
  });

  // Recalculate average rating
  const agg = await prisma.rating.aggregate({
    where: { supplierId },
    _avg: { score: true },
    _count: { score: true },
  });

  await prisma.supplierProfile.updateMany({
    where: { userId: supplierId },
    data: {
      averageRating: agg._avg.score || 0,
      totalRatings: agg._count.score,
    },
  });

  return NextResponse.json({ rating }, { status: 201 });
}

// GET: Ratings for a supplier
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get('supplierId');
  if (!supplierId) return NextResponse.json({ error: 'supplierId required' }, { status: 400 });

  const ratings = await prisma.rating.findMany({
    where: { supplierId },
    include: {
      buyer: { select: { name: true, companyName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ ratings });
}
