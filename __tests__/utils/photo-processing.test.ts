/**
 * Photo Processing Utilities Tests
 *
 * These tests verify critical photo processing behaviors:
 * - Resize to max 1200px width
 * - Aspect ratio preservation
 * - Compression applied
 * - JPEG, PNG, GIF format support
 * - Buffer output format
 * - MIME type handling
 *
 * @jest-environment node
 */

import { processChickenPhoto } from '../../lib/utils/photo-processing';
import sharp from 'sharp';

describe('Photo Processing Utilities', () => {
  // Helper to create test images
  const createTestImage = async (width: number, height: number, format: 'jpeg' | 'png' | 'gif'): Promise<Buffer> => {
    return await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .toFormat(format)
      .toBuffer();
  };

  test('should resize wide image to max 1200px width', async () => {
    const wideImage = await createTestImage(2400, 1200, 'jpeg');
    const mimeType = 'image/jpeg';

    const result = await processChickenPhoto(wideImage, mimeType);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBeLessThanOrEqual(1200);
    expect(result.mimeType).toBe('image/jpeg');
  });

  test('should maintain aspect ratio when resizing', async () => {
    const wideImage = await createTestImage(2400, 1200, 'jpeg'); // 2:1 aspect ratio
    const mimeType = 'image/jpeg';

    const result = await processChickenPhoto(wideImage, mimeType);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(600); // Maintains 2:1 aspect ratio
  });

  test('should not upscale small images', async () => {
    const smallImage = await createTestImage(800, 600, 'jpeg');
    const mimeType = 'image/jpeg';

    const result = await processChickenPhoto(smallImage, mimeType);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBeLessThanOrEqual(800);
  });

  test('should compress JPEG images', async () => {
    const largeImage = await createTestImage(2000, 1500, 'jpeg');
    const mimeType = 'image/jpeg';

    const result = await processChickenPhoto(largeImage, mimeType);

    // Compressed image should be smaller than original
    expect(result.buffer.length).toBeLessThan(largeImage.length);
  });

  test('should process PNG images correctly', async () => {
    const pngImage = await createTestImage(1600, 1200, 'png');
    const mimeType = 'image/png';

    const result = await processChickenPhoto(pngImage, mimeType);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe('png');
    expect(metadata.width).toBeLessThanOrEqual(1200);
    expect(result.mimeType).toBe('image/png');
  });

  test('should process GIF images correctly', async () => {
    const gifImage = await createTestImage(1600, 1200, 'gif');
    const mimeType = 'image/gif';

    const result = await processChickenPhoto(gifImage, mimeType);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe('gif');
    expect(metadata.width).toBeLessThanOrEqual(1200);
    expect(result.mimeType).toBe('image/gif');
  });

  test('should return Buffer output', async () => {
    const testImage = await createTestImage(1600, 1200, 'jpeg');
    const mimeType = 'image/jpeg';

    const result = await processChickenPhoto(testImage, mimeType);

    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(typeof result.mimeType).toBe('string');
  });

  test('should handle errors gracefully with invalid input', async () => {
    const invalidBuffer = Buffer.from('not an image');
    const mimeType = 'image/jpeg';

    await expect(processChickenPhoto(invalidBuffer, mimeType)).rejects.toThrow();
  });
});
