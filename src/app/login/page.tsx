import { AuthForm } from '@/components/ui/auth-form';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign In | TradeX - B2B Industrial Sourcing',
  description: 'Sign in to access your TradeX B2B vendor and supplier dashboard, active RFQs, and interactive map.',
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === 'BUYER') {
      redirect('/dashboard/buyer');
    } else {
      redirect('/dashboard/supplier');
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorative Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-400/10 to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modern Centered Card */}
      <div className="relative z-10 w-full max-w-md">
        <AuthForm onSuccessRedirect="/dashboard" />
      </div>
    </div>
  );
}
