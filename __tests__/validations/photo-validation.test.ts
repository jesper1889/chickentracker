/**
 * Photo Validation Tests
 *
 * These tests verify photo upload validation:
 * - Allowed file types (JPEG, PNG, GIF)
 * - Maximum file size (5MB)
 * - Clear error messages
 *
 * @jest-environment node
 */

import {
  validatePhotoFile,
  isAllowedPhotoType,
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_SIZE,
} from '../../lib/validations/photo';

// Helper to create mock File objects for testing
function createMockFile(type: string, size: number): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], 'test-photo.jpg', { type });
}

describe('Photo Validation', () => {
  test('should validate JPEG photo within size limit', () => {
    const file = createMockFile('image/jpeg', 1024 * 1024); // 1MB

    const result = validatePhotoFile(file);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should validate PNG photo within size limit', () => {
    const file = createMockFile('image/png', 2 * 1024 * 1024); // 2MB

    const result = validatePhotoFile(file);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should validate GIF photo within size limit', () => {
    const file = createMockFile('image/gif', 500 * 1024); // 500KB

    const result = validatePhotoFile(file);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should reject unsupported file type', () => {
    const file = createMockFile('image/webp', 1024 * 1024);

    const result = validatePhotoFile(file);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid file type');
    expect(result.error).toContain('JPEG, PNG, and GIF');
  });

  test('should reject file exceeding 5MB size limit', () => {
    const oversizedFile = createMockFile('image/jpeg', 6 * 1024 * 1024); // 6MB

    const result = validatePhotoFile(oversizedFile);
    expect(result.success).toBe(false);
    expect(result.error).toContain('File size too large');
    expect(result.error).toContain('5MB');
  });

  test('should accept file at exactly 5MB', () => {
    const maxSizeFile = createMockFile('image/jpeg', MAX_PHOTO_SIZE);

    const result = validatePhotoFile(maxSizeFile);
    expect(result.success).toBe(true);
  });

  test('should correctly identify allowed photo types', () => {
    expect(isAllowedPhotoType('image/jpeg')).toBe(true);
    expect(isAllowedPhotoType('image/png')).toBe(true);
    expect(isAllowedPhotoType('image/gif')).toBe(true);
    expect(isAllowedPhotoType('image/webp')).toBe(false);
    expect(isAllowedPhotoType('application/pdf')).toBe(false);
  });

  test('should export correct constants', () => {
    expect(ALLOWED_PHOTO_TYPES).toEqual(['image/jpeg', 'image/png', 'image/gif']);
    expect(MAX_PHOTO_SIZE).toBe(5 * 1024 * 1024);
  });
});
