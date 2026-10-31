import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: Buyer's saved suppliers
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const saved = await prisma.savedSupplier.findMany({
    where: { buyerId: user.userId },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch full supplier profiles
  const supplierIds = saved.map((s) => s.supplierId);
  const suppliers = await prisma.supplierProfile.findMany({
    where: { id: { in: supplierIds } },
    include: {
      user: { select: { name: true, companyName: true, role: true, location: true } },
      products: { take: 2 },
    },
  });

  return NextResponse.json({ suppliers });
}

// POST: Save a supplier
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'BUYER') return NextResponse.json({ error: 'Only buyers can save suppliers' }, { status: 403 });

  const { supplierId } = await req.json();
  if (!supplierId) return NextResponse.json({ error: 'supplierId required' }, { status: 400 });

  const existing = await prisma.savedSupplier.findUnique({
    where: { buyerId_supplierId: { buyerId: user.userId, supplierId } },
  });

  if (existing) {
    await prisma.savedSupplier.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false, message: 'Supplier removed from saved list' });
  }

  await prisma.savedSupplier.create({ data: { buyerId: user.userId, supplierId } });
  return NextResponse.json({ saved: true, message: 'Supplier saved successfully' }, { status: 201 });
}
