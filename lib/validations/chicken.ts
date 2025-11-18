import { z } from 'zod';

/**
 * Chicken profile validation schema
 *
 * Validates all fields for chicken profile creation and updates.
 * This schema is used for both client-side (React Hook Form) and
 * server-side validation to maintain validation parity.
 *
 * Business rules enforced:
 * - Name is required and limited to 100 characters
 * - Breed, sex, dates, and notes are optional
 * - Birth date cannot be in the future
 * - Death date must be after birth date (when both exist)
 * - Notes limited to 2000 characters for reasonable text storage
 */
export const chickenSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less'),

    breed: z.string().max(100, 'Breed must be 100 characters or less').optional(),

    sex: z.enum(['HEN', 'ROOSTER', 'UNKNOWN']).optional(),

    birthDate: z
      .date()
      .max(new Date(), 'Birth date cannot be in the future')
      .optional(),

    deathDate: z.date().optional(),

    notes: z
      .string()
      .max(2000, 'Notes must be 2000 characters or less')
      .optional(),
  })
  .refine(
    (data) => {
      // If both dates exist, death date must be after birth date
      if (data.birthDate && data.deathDate) {
        return data.deathDate > data.birthDate;
      }
      return true;
    },
    {
      message: 'Death date must be after birth date',
      path: ['deathDate'], // Associates error with deathDate field
    }
  );

/**
 * TypeScript type inferred from chickenSchema
 *
 * Use this type for form data in React components and API handlers
 * to ensure type safety and consistency with validation rules.
 */
export type ChickenFormData = z.infer<typeof chickenSchema>;
