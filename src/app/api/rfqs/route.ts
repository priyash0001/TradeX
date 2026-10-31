import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET buyer's RFQs or supplier's received RFQs
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role === 'BUYER') {
    const rfqs = await prisma.rFQ.findMany({
      where: { buyerId: user.userId },
      include: {
        supplier: {
          include: { user: { select: { name: true, companyName: true, role: true } } },
        },
        quotations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ rfqs });
  } else {
    const profile = await prisma.supplierProfile.findUnique({ where: { userId: user.userId } });
    if (!profile) return NextResponse.json({ rfqs: [] });

    const rfqs = await prisma.rFQ.findMany({
      where: { supplierId: profile.id },
      include: {
        buyer: { select: { name: true, companyName: true, email: true, mobile: true } },
        quotations: { where: { supplierId: user.userId } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ rfqs });
  }
}

// POST: Create a new RFQ (buyers only) — supports single or broadcast to multiple suppliers
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'BUYER') return NextResponse.json({ error: 'Only buyers can create RFQs' }, { status: 403 });

  const body = await req.json();
  const { supplierId, supplierIds, productName, description, quantity, unit, deadline } = body;

  const targetSupplierIds: string[] = Array.isArray(supplierIds) && supplierIds.length > 0
    ? supplierIds
    : supplierId
    ? [supplierId]
    : [];

  if (targetSupplierIds.length === 0 || !productName || !quantity) {
    return NextResponse.json({ error: 'Supplier(s), product name, and quantity are required' }, { status: 400 });
  }

  // Batch lookup known supplier profiles to avoid N+1 DB queries in broadcast loops
  const existingProfiles = await prisma.supplierProfile.findMany({
    where: {
      OR: [
        { id: { in: targetSupplierIds } },
        { userId: { in: targetSupplierIds } },
      ],
    },
  });
  const profileMap = new Map<string, any>();
  for (const p of existingProfiles) {
    profileMap.set(p.id, p);
    profileMap.set(p.userId, p);
  }

  const resolveSupplier = async (id: string) => {
    let supplier = profileMap.get(id);
    if (!supplier) {
      supplier = await prisma.supplierProfile.findUnique({ where: { id } });
    }
    if (!supplier) {
      supplier = await prisma.supplierProfile.findUnique({ where: { userId: id } });
    }

    if (!supplier) {
      const cleanMidcId = id.startsWith('midc-') ? id.replace('midc-', '') : id;
      const midcItem = await prisma.midcBusiness.findUnique({ where: { id: cleanMidcId } });
      if (midcItem) {
        const placeholderEmail = `midc-${midcItem.id}@tradex.local`;
        let midcUser = await prisma.user.findUnique({ where: { email: placeholderEmail } });
        if (!midcUser) {
          const numericSuffix = Math.abs(midcItem.id.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString().slice(0, 8).padEnd(8, '0');
          midcUser = await prisma.user.create({
            data: {
              name: midcItem.companyName,
              companyName: midcItem.companyName,
              email: placeholderEmail,
              mobile: `98${numericSuffix}`,
              password: 'PLACEHOLDER_HASH',
              role: midcItem.businessType === 'VENDOR' ? 'VENDOR' : 'MANUFACTURER',
              location: midcItem.city,
            },
          });
        }
        supplier = await prisma.supplierProfile.upsert({
          where: { userId: midcUser.id },
          update: {},
          create: {
            userId: midcUser.id,
            city: midcItem.city,
            state: midcItem.state,
            address: midcItem.plotAddress,
            pincode: midcItem.pincode,
            latitude: midcItem.latitude || 19.9975,
            longitude: midcItem.longitude || 73.7898,
            isVerified: true,
          },
        });
      }
    }
    return supplier;
  };

  const createdRfqs = [];

  for (const sid of targetSupplierIds) {
    const supplier = await resolveSupplier(sid);
    if (!supplier) continue;

    const rfq = await prisma.rFQ.create({
      data: {
        buyerId: user.userId,
        supplierId: supplier.id,
        productName: productName.trim(),
        description: description ? description.trim() : '',
        quantity: parseInt(quantity, 10),
        unit: unit || 'units',
        deadline: deadline ? new Date(deadline) : null,
        status: 'PENDING',
      },
      include: {
        supplier: {
          include: { user: { select: { name: true, companyName: true } } },
        },
      },
    });

    // Notify the supplier
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        rfqId: rfq.id,
        type: 'NEW_RFQ',
        title: 'New RFQ Received',
        message: `${user.name} sent you an RFQ for ${productName} (Qty: ${quantity} ${unit || 'units'})`,
      },
    });

    createdRfqs.push(rfq);
  }

  if (createdRfqs.length === 0) {
    return NextResponse.json({ error: 'Failed to resolve any valid suppliers' }, { status: 404 });
  }

  return NextResponse.json({
    rfqs: createdRfqs,
    rfq: createdRfqs[0],
    count: createdRfqs.length,
    message: createdRfqs.length > 1 ? `Broadcast RFQ dispatched to ${createdRfqs.length} suppliers` : 'RFQ created successfully',
  }, { status: 201 });
}
