/**
 * Photo Processing Utilities
 *
 * Provides image processing functionality for chicken photos:
 * - Resize images to maximum 1200px width
 * - Maintain aspect ratio
 * - Apply compression for optimal storage
 * - Support JPEG, PNG, and GIF formats
 */

import sharp from 'sharp';

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 85;
const PNG_COMPRESSION_LEVEL = 9;

interface ProcessedPhoto {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Process a chicken photo for storage
 *
 * @param input - Image buffer to process
 * @param mimeType - Original MIME type of the image
 * @returns Processed image buffer and MIME type
 * @throws Error if image processing fails
 */
export async function processChickenPhoto(
  input: Buffer,
  mimeType: string
): Promise<ProcessedPhoto> {
  try {
    // Initialize sharp with input buffer
    let image = sharp(input);

    // Get original image metadata
    const metadata = await image.metadata();
    const originalWidth = metadata.width || 0;

    // Only resize if image is wider than MAX_WIDTH
    if (originalWidth > MAX_WIDTH) {
      image = image.resize(MAX_WIDTH, null, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific compression
    let processedBuffer: Buffer;

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      processedBuffer = await image
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
    } else if (mimeType === 'image/png') {
      processedBuffer = await image
        .png({ compressionLevel: PNG_COMPRESSION_LEVEL })
        .toBuffer();
    } else if (mimeType === 'image/gif') {
      // GIF compression is handled automatically by sharp
      processedBuffer = await image.gif().toBuffer();
    } else {
      throw new Error(`Unsupported image format: ${mimeType}`);
    }

    return {
      buffer: processedBuffer,
      mimeType,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to process photo: ${error.message}`);
    }
    throw new Error('Failed to process photo: Unknown error');
  }
}
