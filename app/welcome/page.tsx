import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/auth/logout-button';

/**
 * Welcome Page Component
 *
 * Protected landing page displayed after successful login.
 * Features:
 * - Server-side session checking with NextAuth
 * - Personalized greeting with user's name or email
 * - Navigation to chicken management and egg production
 * - Logout functionality
 * - Consistent branding with login page
 *
 * This is a server component that redirects unauthenticated users to login.
 */
export default async function WelcomePage() {
  // Check authentication status using NextAuth server session
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Extract user data from session
  const { name, email } = session.user;

  // Use name if available, otherwise fallback to email
  const displayName = name || email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Logout button positioned in top-right corner */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6">
        <LogoutButton />
      </div>

      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-2 text-center">
          {/* Personalized welcome message */}
          <CardTitle className="text-3xl font-bold tracking-tight text-amber-900">
            Welcome, {displayName}!
          </CardTitle>
          <CardDescription className="text-base text-amber-700">
            ChickenTracker - Your flock management system
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User information display */}
          <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">
              Account Information
            </h3>
            <div className="space-y-1 text-sm text-amber-800">
              <p>
                <span className="font-medium">Email:</span> {email}
              </p>
              {name && (
                <p>
                  <span className="font-medium">Name:</span> {name}
                </p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
            <h3 className="text-sm font-semibold text-orange-900 mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Link href="/chickens">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Manage My Chickens
                </Button>
              </Link>
              <Link href="/egg-production">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Egg Production Log
                </Button>
              </Link>
            </div>
          </div>

          {/* Session information */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>
              Your session will remain active for 30 days. You can safely close
              this tab and return anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
