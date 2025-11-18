/**
 * Middleware Route Protection Tests
 *
 * These tests verify critical middleware route protection behaviors:
 * - Root route redirection based on auth status
 * - Protected route blocking for unauthenticated users
 * - Authenticated user redirect from login page
 *
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../middleware';

// Helper function to create a mock request
function createRequest(pathname: string, hasSessionToken: boolean = false) {
  const req = new NextRequest(new URL(`http://localhost:3000${pathname}`));

  // Mock cookies based on authentication status
  if (hasSessionToken) {
    Object.defineProperty(req, 'cookies', {
      get: jest.fn(() => ({
        get: jest.fn((name: string) => {
          if (name === 'authjs.session-token') {
            return { value: 'mock-session-token' };
          }
          return undefined;
        }),
      })),
    });
  } else {
    Object.defineProperty(req, 'cookies', {
      get: jest.fn(() => ({
        get: jest.fn(() => undefined),
      })),
    });
  }

  return req;
}

describe('Middleware Route Protection', () => {
  test('should redirect unauthenticated user from root to /login', () => {
    const req = createRequest('/', false);
    const response = middleware(req);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get('location')).toContain('/login');
  });

  test('should redirect authenticated user from root to /welcome', () => {
    const req = createRequest('/', true);
    const response = middleware(req);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get('location')).toContain('/welcome');
  });

  test('should redirect authenticated user trying to access /login to /welcome', () => {
    const req = createRequest('/login', true);
    const response = middleware(req);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get('location')).toContain('/welcome');
  });

  test('should redirect unauthenticated user from protected route to /login with callback', () => {
    const req = createRequest('/welcome', false);
    const response = middleware(req);

    const locationHeader = response.headers.get('location');
    expect(locationHeader).toContain('/login');
    expect(locationHeader).toContain('callbackUrl');
  });
});
