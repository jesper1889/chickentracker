/**
 * Logout Button Component Tests
 *
 * These tests verify critical logout button behaviors:
 * - Button rendering and signOut call
 * - Loading state during logout
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogoutButton from '../../components/auth/logout-button';
import { signOut } from 'next-auth/react';

// Mock NextAuth signOut function
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('Logout Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render and call signOut when clicked', async () => {
    (signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({
        callbackUrl: '/login',
        redirect: true,
      });
    });
  });

  test('should show loading state and disable button during logout', async () => {
    (signOut as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
    );

    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Signing out...');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });
});
