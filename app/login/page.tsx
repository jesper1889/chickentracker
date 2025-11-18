'use client';

/**
 * Login Page Component
 *
 * Provides secure email/password authentication for ChickenTracker users.
 * Features:
 * - Client-side form validation using Zod schema
 * - React Hook Form for form state management
 * - NextAuth credentials provider integration
 * - Responsive mobile-first design
 * - Full accessibility support with ARIA labels
 * - Loading states and error handling
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize React Hook Form with Zod validation schema
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Handle form submission
   * - Validates credentials using NextAuth signIn
   * - Redirects to welcome page on success
   * - Displays generic error message on failure
   */
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Call NextAuth signIn with credentials provider
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Display generic error message to prevent user enumeration
        setAuthError('Invalid email or password');
        setIsLoading(false);
      } else if (result?.ok) {
        // Successful login - redirect to welcome page
        router.push('/welcome');
      }
    } catch (error) {
      // Handle unexpected errors
      console.error('Login error:', error);
      setAuthError('Unable to connect. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          {/* ChickenTracker branding header */}
          <CardTitle className="text-3xl font-bold tracking-tight text-amber-900">
            ChickenTracker
          </CardTitle>
          <CardDescription className="text-base text-amber-700">
            Sign in to manage your flock
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email input field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="h-11"
                {...register('email')}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password input field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="h-11"
                {...register('password')}
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-red-600"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Authentication error message */}
            {authError && (
              <div
                className="rounded-md bg-red-50 p-3 text-sm text-red-800"
                role="alert"
                aria-live="polite"
              >
                {authError}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
