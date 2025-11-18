/**
 * Chicken Photo API Route
 *
 * GET /api/chickens/[id]/photo - Serve chicken photo as image response
 *
 * Authentication: Required
 * Authorization: Users can only access photos of their own chickens
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/chickens/[id]/photo
 *
 * Retrieve and serve a chicken's photo as an image response.
 * Includes cache headers for optimal performance.
 * Verifies the chicken belongs to the authenticated user.
 *
 * @param params - Route parameters containing chicken id
 * @returns Image response with photo data on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 403 Forbidden if chicken belongs to different user
 * @returns 404 Not Found if chicken or photo doesn't exist
 * @returns 500 Internal Server Error on server failure
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Await params in Next.js 16+
    const { id } = await params;

    // Get chicken with photo data
    const chicken = await prisma.chicken.findUnique({
      where: { id },
      select: {
        userId: true,
        photo: true,
        photoMimeType: true,
      },
    });

    // Return 404 if chicken not found
    if (!chicken) {
      return NextResponse.json(
        { error: 'Chicken not found.' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (chicken.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only access photos of your own chickens.' },
        { status: 403 }
      );
    }

    // Return 404 if no photo exists
    if (!chicken.photo || !chicken.photoMimeType) {
      return NextResponse.json(
        { error: 'No photo available for this chicken.' },
        { status: 404 }
      );
    }

    // Convert Buffer to Uint8Array for Response
    const photoBuffer = Buffer.from(chicken.photo);

    // Return photo as image response with caching headers
    return new NextResponse(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': chicken.photoMimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': photoBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving chicken photo:', error);
    return NextResponse.json(
      { error: 'Failed to serve photo. Please try again.' },
      { status: 500 }
    );
  }
}
