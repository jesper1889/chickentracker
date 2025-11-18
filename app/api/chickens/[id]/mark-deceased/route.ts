/**
 * Mark Chicken as Deceased API Route
 *
 * POST /api/chickens/[id]/mark-deceased - Set death date on chicken
 *
 * Authentication: Required
 * Authorization: Users can only mark their own chickens as deceased
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/chickens/[id]/mark-deceased
 *
 * Mark a chicken as deceased by setting its death date.
 * Validates that death date is not in the future and is after birth date.
 *
 * Request Body:
 * {
 *   "deathDate": "2023-12-01" // ISO date string
 * }
 *
 * @param params - Route parameters containing chicken id
 * @returns 200 OK with updated chicken data on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 403 Forbidden if chicken belongs to different user
 * @returns 404 Not Found if chicken doesn't exist
 * @returns 400 Bad Request if validation fails
 * @returns 500 Internal Server Error on server failure
 */
export async function POST(
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

    // Get chicken to verify ownership and check birth date
    const chicken = await prisma.chicken.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        birthDate: true,
        name: true,
      },
    });

    // Return 404 if not found
    if (!chicken) {
      return NextResponse.json(
        { error: 'Chicken not found.' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (chicken.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only mark your own chickens as deceased.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const deathDateStr = body.deathDate;

    // Validate death date is provided
    if (!deathDateStr) {
      return NextResponse.json(
        { error: 'Death date is required.' },
        { status: 400 }
      );
    }

    // Parse death date
    const deathDate = new Date(deathDateStr);

    // Validate death date is a valid date
    if (isNaN(deathDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid death date format.' },
        { status: 400 }
      );
    }

    // Validate death date is not in the future
    const now = new Date();
    if (deathDate > now) {
      return NextResponse.json(
        { error: 'Death date cannot be in the future.' },
        { status: 400 }
      );
    }

    // Validate death date is after birth date (if birth date exists)
    if (chicken.birthDate) {
      if (deathDate < chicken.birthDate) {
        return NextResponse.json(
          { error: 'Death date must be after birth date.' },
          { status: 400 }
        );
      }
    }

    // Update chicken with death date
    const updatedChicken = await prisma.chicken.update({
      where: { id },
      data: { deathDate },
      select: {
        id: true,
        userId: true,
        name: true,
        breed: true,
        sex: true,
        birthDate: true,
        deathDate: true,
        photoMimeType: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // Exclude photo buffer from JSON response
      },
    });

    return NextResponse.json(updatedChicken, { status: 200 });
  } catch (error) {
    console.error('Error marking chicken as deceased:', error);
    return NextResponse.json(
      { error: 'Failed to mark chicken as deceased. Please try again.' },
      { status: 500 }
    );
  }
}
