import { z } from 'zod';

/**
 * Login form validation schema
 *
 * Validates email format and password complexity requirements.
 * This schema is used for both client-side (React Hook Form) and
 * server-side validation to maintain validation parity.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => /[a-zA-Z]/.test(password),
      'Password must contain at least one letter'
    )
    .refine(
      (password) => /[0-9]/.test(password),
      'Password must contain at least one number'
    ),
});

/**
 * TypeScript type inferred from loginSchema
 *
 * Use this type for form data in React components and API handlers
 * to ensure type safety and consistency with validation rules.
 */
export type LoginFormData = z.infer<typeof loginSchema>;
