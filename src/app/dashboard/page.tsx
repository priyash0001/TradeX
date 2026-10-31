import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

// No force-dynamic — Next.js will still run this on each request
// because redirect() prevents caching, but avoids the extra render overhead
export default async function DashboardRootPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'BUYER') {
    redirect('/dashboard/buyer');
  } else {
    redirect('/dashboard/supplier');
  }
}
