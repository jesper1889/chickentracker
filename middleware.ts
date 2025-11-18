import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for Route Protection
 *
 * Protects routes by checking authentication status and redirecting
 * unauthenticated users to the login page.
 *
 * Configuration:
 * - Public routes: /login, /api/auth/*
 * - Protected routes: All other routes
 * - Root route (/): Redirects based on auth status
 *
 * Note: This middleware uses cookies to check auth status instead of
 * importing the auth function directly, as Prisma cannot run in Edge Runtime.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if user is authenticated by looking for NextAuth session token
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value;

  const isAuthenticated = !!sessionToken;

  // Define public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Handle root route redirect logic
  if (pathname === '/') {
    if (isAuthenticated) {
      // Redirect authenticated users to welcome page
      return NextResponse.redirect(new URL('/welcome', req.url));
    } else {
      // Redirect unauthenticated users to login page
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Allow access to public routes
  if (isPublicRoute) {
    // If already authenticated and trying to access login, redirect to welcome
    if (isAuthenticated && pathname === '/login') {
      return NextResponse.redirect(new URL('/welcome', req.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    // Store the original URL to redirect back after login (optional)
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to access protected routes
  return NextResponse.next();
}

/**
 * Middleware matcher configuration
 *
 * Specifies which routes the middleware should run on.
 * - Includes all routes except static files and API auth routes
 * - API auth routes are handled by NextAuth internally
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api/auth/* (NextAuth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
};
