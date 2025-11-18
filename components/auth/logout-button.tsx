'use client';

/**
 * Logout Button Component
 *
 * Client component that handles user logout functionality.
 * Features:
 * - Calls NextAuth signOut on click
 * - Shows loading state during sign-out
 * - Redirects to login page after successful logout
 * - Accessible button with proper ARIA attributes
 */

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle logout button click
   * - Sets loading state
   * - Calls NextAuth signOut with redirect to login
   */
  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Call NextAuth signOut and redirect to login page
      await signOut({
        callbackUrl: '/login',
        redirect: true,
      });
    } catch (error) {
      // Handle unexpected errors
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      aria-busy={isLoading}
      className="bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors"
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
