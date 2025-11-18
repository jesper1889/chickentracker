import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * Root Page Component
 *
 * Handles root route (/) redirect logic based on authentication status.
 * - Authenticated users: Redirect to /welcome
 * - Unauthenticated users: Redirect to /login
 *
 * Note: This logic is also handled by middleware, but this provides
 * a server-side fallback for consistency.
 */
export default async function HomePage() {
  // Check authentication status
  const session = await auth();

  // Redirect based on authentication status
  if (session?.user) {
    // User is authenticated - redirect to welcome page
    redirect('/welcome');
  } else {
    // User is not authenticated - redirect to login page
    redirect('/login');
  }
}
