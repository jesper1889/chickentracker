import { z } from 'zod';

/**
 * Egg Production validation schema
 *
 * Validates all fields for egg production entry creation and updates.
 * This schema is used for both client-side (React Hook Form) and
 * server-side validation to maintain validation parity.
 *
 * Business rules enforced:
 * - Date is required and must be a valid date (not in future)
 * - Count is required, must be a non-negative integer
 * - Explicit "0 eggs" entries are valid
 * - One entry per day per user (enforced at database level)
 *
 * Error messages are designed to be user-friendly and actionable.
 */
export const eggProductionSchema = z.object({
  date: z
    .date()
    .max(new Date(), 'Date cannot be in the future'),

  count: z
    .number()
    .int('Count must be a whole number')
    .min(0, 'Count cannot be negative'),
});

/**
 * TypeScript type inferred from eggProductionSchema
 *
 * Use this type for form data in React components and API handlers
 * to ensure type safety and consistency with validation rules.
 */
export type EggProductionFormData = z.infer<typeof eggProductionSchema>;
