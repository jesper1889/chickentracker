/**
 * Egg Production Page (Server Component)
 *
 * Protected page that displays egg production management interface.
 * Handles authentication check and redirects to login if not authenticated.
 *
 * Features:
 * - Server-side authentication check
 * - Delegates to client component for interactivity
 * - Responsive layout with amber/orange branding
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import EggProductionClient from '@/components/egg-production-client';

export default async function EggProductionPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <EggProductionClient />
      </div>
    </div>
  );
}
