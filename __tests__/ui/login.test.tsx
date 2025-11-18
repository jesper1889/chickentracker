/**
 * Login UI Tests
 *
 * These tests verify critical login UI behaviors:
 * - Form rendering with required fields
 * - Form validation with invalid inputs
 * - Form submission handling
 * - Error message display
 * - Loading state during submission
 * - Successful login redirect
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../../app/login/page';
import { signIn } from 'next-auth/react';

// Mock NextAuth signIn function
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation for redirect testing
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Login Page UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render login form with email and password fields', () => {
    render(<LoginPage />);

    // Check for ChickenTracker branding
    expect(screen.getByText(/chickentracker/i)).toBeInTheDocument();

    // Check for form fields
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('should display validation errors for invalid email format', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  test('should display validation errors for password requirements', async () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter password that's too short
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  test('should call signIn with credentials on valid form submission', async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({ error: null, ok: true });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter valid credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
    fireEvent.click(submitButton);

    // Wait for form submission
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'testpass123',
        redirect: false,
      });
    });
  });

  test('should display error message on failed login', async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({
      error: 'CredentialsSignin',
      ok: false,
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass123' } });
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('should show loading state during form submission', async () => {
    // Mock signIn to delay response
    (signIn as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null, ok: true }), 100)
        )
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter valid credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
    fireEvent.click(submitButton);

    // Check button is disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  test('should redirect to welcome page on successful login', async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({ error: null, ok: true });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Enter valid credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
    fireEvent.click(submitButton);

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/welcome');
    });
  });

  test('should have accessible form with ARIA labels', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Check for proper accessibility attributes
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(emailInput).toHaveAttribute('id');
    expect(passwordInput).toHaveAttribute('id');
  });
});
