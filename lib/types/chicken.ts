/**
 * Frontend TypeScript types for Chicken Profile Management
 *
 * These types define the shape of chicken data used throughout the frontend.
 * They are based on the Prisma Chicken model but exclude binary photo data
 * for JSON serialization compatibility.
 */

import { Sex } from '@/lib/generated/prisma/enums';

/**
 * Chicken interface for frontend use
 *
 * Represents a chicken profile without the binary photo buffer.
 * The photo is accessed via a separate API endpoint.
 */
export interface Chicken {
  id: string;
  userId: string;
  name: string;
  breed: string | null;
  sex: Sex | null;
  birthDate: Date | null;
  deathDate: Date | null;
  photoMimeType: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data type for chicken creation and editing
 *
 * This type represents the data structure used in forms before
 * submission to the API. It matches the ChickenFormData type
 * from the validation schema.
 */
export interface ChickenFormInput {
  name: string;
  breed?: string;
  sex?: Sex;
  birthDate?: Date;
  deathDate?: Date;
  notes?: string;
  photo?: File;
}

/**
 * Re-export Sex enum for convenient imports
 */
export { Sex };
