/**
 * Authentication Validation Schema Tests
 *
 * These tests verify critical Zod validation schema behaviors:
 * - Valid credentials acceptance
 * - Password complexity enforcement
 * - Email format validation
 *
 * @jest-environment node
 */

import { loginSchema } from '../../lib/validations/auth';

describe('Login Validation Schema', () => {
  test('should validate correct email and password', () => {
    const validData = {
      email: 'user@example.com',
      password: 'ValidPass123',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('should reject password without letter and number requirements', () => {
    const noLetterData = {
      email: 'user@example.com',
      password: '12345678',
    };

    const noNumberData = {
      email: 'user@example.com',
      password: 'OnlyLetters',
    };

    const noLetterResult = loginSchema.safeParse(noLetterData);
    const noNumberResult = loginSchema.safeParse(noNumberData);

    expect(noLetterResult.success).toBe(false);
    expect(noNumberResult.success).toBe(false);
  });

  test('should reject password shorter than 8 characters', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'Short1',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('should reject invalid email format', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'ValidPass123',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
