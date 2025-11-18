/**
 * Egg Production Validation Schema Tests
 *
 * These tests verify critical Zod validation schema behaviors:
 * - Date validation (required, not in future)
 * - Count validation (required, non-negative integer)
 * - Support for "0 eggs" as valid entry
 * - Error messages are clear and actionable
 *
 * @jest-environment node
 */

import { eggProductionSchema } from '../../lib/validations/egg-production';

describe('Egg Production Validation Schema', () => {
  test('should validate egg production entry with valid date and count', () => {
    const pastDate = new Date('2025-11-15');
    const validData = {
      date: pastDate,
      count: 5,
    };

    const result = eggProductionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('should validate "0 eggs" as a valid count (explicit logging)', () => {
    const validData = {
      date: new Date('2025-11-15'),
      count: 0,
    };

    const result = eggProductionSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(0);
    }
  });

  test('should reject negative count values', () => {
    const invalidData = {
      date: new Date('2025-11-15'),
      count: -1,
    };

    const result = eggProductionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('negative');
    }
  });

  test('should reject decimal count values', () => {
    const invalidData = {
      date: new Date('2025-11-15'),
      count: 2.5,
    };

    const result = eggProductionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('whole number');
    }
  });

  test('should reject date in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureData = {
      date: tomorrow,
      count: 5,
    };

    const result = eggProductionSchema.safeParse(futureData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('future');
    }
  });

  test('should reject missing date field', () => {
    const missingDateData = {
      count: 5,
    } as any;

    const result = eggProductionSchema.safeParse(missingDateData);
    expect(result.success).toBe(false);
  });

  test('should reject missing count field', () => {
    const missingCountData = {
      date: new Date('2025-11-15'),
    } as any;

    const result = eggProductionSchema.safeParse(missingCountData);
    expect(result.success).toBe(false);
  });

  test('should accept valid large count values', () => {
    const largeCountData = {
      date: new Date('2025-11-15'),
      count: 10000,
    };

    const result = eggProductionSchema.safeParse(largeCountData);
    expect(result.success).toBe(true);
  });
});
