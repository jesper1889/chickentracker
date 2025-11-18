/**
 * Photo validation utilities
 *
 * Provides constants and validation functions for chicken photo uploads.
 * Used in API routes to enforce file type and size restrictions before
 * processing images with the sharp library.
 */

/**
 * Allowed MIME types for chicken photos
 *
 * Restricts uploads to common web-safe image formats:
 * - JPEG (most common)
 * - PNG (transparency support)
 * - GIF (animation support, though unlikely for chicken photos)
 */
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif'] as const;

/**
 * Maximum photo file size in bytes (5MB)
 *
 * Limit enforced to:
 * - Prevent database bloat (photos stored as binary data)
 * - Ensure reasonable upload times
 * - Reduce server processing load
 *
 * Note: Images are automatically resized to 1200px max width,
 * so even 5MB originals will be significantly smaller after processing
 */
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validates photo file meets type and size requirements
 *
 * @param file - File object from form upload
 * @returns Object with success flag and optional error message
 *
 * @example
 * ```typescript
 * const validation = validatePhotoFile(file);
 * if (!validation.success) {
 *   return Response.json({ error: validation.error }, { status: 400 });
 * }
 * ```
 */
export function validatePhotoFile(file: File): {
  success: boolean;
  error?: string;
} {
  // Validate file type
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as any)) {
    return {
      success: false,
      error: `Invalid file type. Only JPEG, PNG, and GIF images are allowed. Received: ${file.type}`,
    };
  }

  // Validate file size
  if (file.size > MAX_PHOTO_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      success: false,
      error: `File size too large. Maximum size is 5MB. Your file is ${sizeMB}MB`,
    };
  }

  return { success: true };
}

/**
 * Type guard to check if MIME type is allowed
 *
 * @param mimeType - MIME type string to check
 * @returns true if MIME type is in ALLOWED_PHOTO_TYPES
 */
export function isAllowedPhotoType(
  mimeType: string
): mimeType is (typeof ALLOWED_PHOTO_TYPES)[number] {
  return ALLOWED_PHOTO_TYPES.includes(mimeType as any);
}
