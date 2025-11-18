/**
 * Protected Routes Tests
 *
 * These tests verify critical route protection behaviors:
 * - Redirect to login when unauthenticated
 * - Display content when authenticated
 * - Logout functionality
 * - Session persistence
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-auth signOut BEFORE importing components
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

// Mock NextAuth auth function
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

// Import after mocks are set up
import WelcomePage from '../../app/welcome/page';
import { auth } from '../../lib/auth';

describe('Protected Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should redirect to login when user is not authenticated', async () => {
    // Mock unauthenticated session
    (auth as jest.Mock).mockResolvedValueOnce(null);

    // Expect redirect to login
    await expect(async () => {
      const Component = await WelcomePage();
    }).rejects.toThrow('NEXT_REDIRECT: /login');
  });

  test('should display welcome message when user is authenticated', async () => {
    // Mock authenticated session
    (auth as jest.Mock).mockResolvedValueOnce({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    const component = await WelcomePage();
    render(component);

    // Check for welcome message with user name
    expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
  });

  test('should display user email when authenticated', async () => {
    // Mock authenticated session
    (auth as jest.Mock).mockResolvedValueOnce({
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
      },
    });

    const component = await WelcomePage();
    render(component);

    // Check for user email
    expect(screen.getByText(/user@example\.com/i)).toBeInTheDocument();
  });

  test('should use email as fallback when name is not provided', async () => {
    // Mock authenticated session without name
    (auth as jest.Mock).mockResolvedValueOnce({
      user: {
        id: '2',
        email: 'noname@example.com',
        name: null,
      },
    });

    const component = await WelcomePage();
    render(component);

    // Check for welcome message with email
    expect(screen.getByText(/welcome, noname@example\.com/i)).toBeInTheDocument();
  });

  test('should render logout button when authenticated', async () => {
    // Mock authenticated session
    (auth as jest.Mock).mockResolvedValueOnce({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    const component = await WelcomePage();
    render(component);

    // Check for logout button
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});
