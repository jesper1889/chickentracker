/**
 * Frontend TypeScript types for Egg Production Management
 *
 * These types define the shape of egg production data used throughout the frontend.
 * They are based on the Prisma EggProduction model for JSON serialization compatibility.
 */

/**
 * EggProduction interface for frontend use
 *
 * Represents a daily egg production record with date and count.
 */
export interface EggProduction {
  id: string;
  userId: string;
  date: Date;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data type for egg production entry creation and editing
 *
 * This type represents the data structure used in forms before
 * submission to the API. It matches the EggProductionFormData type
 * from the validation schema.
 */
export interface EggProductionFormInput {
  date: Date;
  count: number;
}
