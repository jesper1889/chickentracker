/**
 * Chicken Validation Schema Tests
 *
 * These tests verify critical Zod validation schema behaviors:
 * - Name validation (required, max length)
 * - Breed validation (max length)
 * - Sex enum validation
 * - Birth date validation (not in future)
 * - Death date validation (after birth date)
 * - Notes validation (max length)
 *
 * @jest-environment node
 */

import { chickenSchema } from '../../lib/validations/chicken';

describe('Chicken Validation Schema', () => {
  test('should validate chicken with all valid fields', () => {
    const pastDate = new Date('2020-01-01');
    const validData = {
      name: 'Henrietta',
      breed: 'Rhode Island Red',
      sex: 'HEN' as const,
      birthDate: pastDate,
      deathDate: new Date('2023-06-15'),
      notes: 'A friendly chicken who loves corn',
    };

    const result = chickenSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('should validate chicken with only required name field', () => {
    const minimalData = {
      name: 'Clucky',
    };

    const result = chickenSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  test('should reject empty or missing name', () => {
    const emptyNameData = {
      name: '',
    };

    const missingNameData = {};

    const emptyResult = chickenSchema.safeParse(emptyNameData);
    const missingResult = chickenSchema.safeParse(missingNameData);

    expect(emptyResult.success).toBe(false);
    expect(missingResult.success).toBe(false);
  });

  test('should reject name exceeding 100 characters', () => {
    const longNameData = {
      name: 'A'.repeat(101),
    };

    const result = chickenSchema.safeParse(longNameData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100 characters');
    }
  });

  test('should reject breed exceeding 100 characters', () => {
    const longBreedData = {
      name: 'Henrietta',
      breed: 'B'.repeat(101),
    };

    const result = chickenSchema.safeParse(longBreedData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100 characters');
    }
  });

  test('should validate all allowed sex enum values', () => {
    const henData = { name: 'Henrietta', sex: 'HEN' as const };
    const roosterData = { name: 'Rocky', sex: 'ROOSTER' as const };
    const unknownData = { name: 'Mystery', sex: 'UNKNOWN' as const };

    expect(chickenSchema.safeParse(henData).success).toBe(true);
    expect(chickenSchema.safeParse(roosterData).success).toBe(true);
    expect(chickenSchema.safeParse(unknownData).success).toBe(true);
  });

  test('should reject birth date in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureData = {
      name: 'Henrietta',
      birthDate: tomorrow,
    };

    const result = chickenSchema.safeParse(futureData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('future');
    }
  });

  test('should reject death date before birth date', () => {
    const birthDate = new Date('2020-06-01');
    const deathDate = new Date('2020-01-01'); // Before birth

    const invalidData = {
      name: 'Henrietta',
      birthDate,
      deathDate,
    };

    const result = chickenSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Death date must be after birth date');
      expect(result.error.issues[0].path).toContain('deathDate');
    }
  });

  test('should accept death date after birth date', () => {
    const birthDate = new Date('2020-01-01');
    const deathDate = new Date('2023-06-15'); // After birth

    const validData = {
      name: 'Henrietta',
      birthDate,
      deathDate,
    };

    const result = chickenSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('should reject notes exceeding 2000 characters', () => {
    const longNotesData = {
      name: 'Henrietta',
      notes: 'N'.repeat(2001),
    };

    const result = chickenSchema.safeParse(longNotesData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2000 characters');
    }
  });
});
