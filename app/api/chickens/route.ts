/**
 * Chicken API Routes - Create and List
 *
 * POST /api/chickens - Create new chicken with optional photo upload
 * GET /api/chickens - List all chickens for authenticated user with filtering
 *
 * Authentication: Required for all operations
 * Authorization: Users can only manage their own chickens
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { chickenSchema } from '@/lib/validations/chicken';
import { validatePhotoFile } from '@/lib/validations/photo';
import { processChickenPhoto } from '@/lib/utils/photo-processing';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

/**
 * POST /api/chickens
 *
 * Create a new chicken profile with optional photo upload.
 * Supports multipart/form-data for photo uploads.
 *
 * @returns 201 Created with chicken data on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 400 Bad Request if validation fails
 * @returns 500 Internal Server Error on server failure
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse FormData for multipart support
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name') as string;
    const breed = formData.get('breed') as string | null;
    const sex = formData.get('sex') as 'HEN' | 'ROOSTER' | 'UNKNOWN' | null;
    const birthDateStr = formData.get('birthDate') as string | null;
    const deathDateStr = formData.get('deathDate') as string | null;
    const notes = formData.get('notes') as string | null;
    const photoFile = formData.get('photo') as File | null;

    // Parse dates
    const birthDate = birthDateStr ? new Date(birthDateStr) : undefined;
    const deathDate = deathDateStr ? new Date(deathDateStr) : undefined;

    // Build validation data object
    const validationData: any = {
      name,
    };

    if (breed) validationData.breed = breed;
    if (sex) validationData.sex = sex;
    if (birthDate) validationData.birthDate = birthDate;
    if (deathDate) validationData.deathDate = deathDate;
    if (notes) validationData.notes = notes;

    // Validate chicken data with Zod schema
    const validated = chickenSchema.parse(validationData);

    // Process photo if provided
    let photoBuffer: Buffer | undefined;
    let photoMimeType: string | undefined;

    if (photoFile && photoFile.size > 0) {
      // Validate photo file
      const photoValidation = validatePhotoFile(photoFile);
      if (!photoValidation.success) {
        return NextResponse.json(
          { error: photoValidation.error },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await photoFile.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Process photo (resize, compress)
      const processed = await processChickenPhoto(inputBuffer, photoFile.type);
      photoBuffer = processed.buffer;
      photoMimeType = processed.mimeType;
    }

    // Create chicken in database
    const chicken = await prisma.chicken.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        breed: validated.breed || null,
        sex: validated.sex || null,
        birthDate: validated.birthDate || null,
        deathDate: validated.deathDate || null,
        notes: validated.notes || null,
        photo: photoBuffer ? Uint8Array.from(photoBuffer) : null,
        photoMimeType: photoMimeType || null,
      },
    });

    // Return created chicken (exclude photo buffer from JSON)
    const { photo, ...chickenWithoutPhoto } = chicken;

    return NextResponse.json(chickenWithoutPhoto, { status: 201 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Error creating chicken:', error);
    return NextResponse.json(
      { error: 'Failed to create chicken. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chickens
 *
 * List all chickens for the authenticated user.
 * Supports optional status filtering via query parameter.
 *
 * Query Parameters:
 * - status: "active" | "deceased" | "all" (default: "all")
 *
 * @returns 200 OK with array of chickens
 * @returns 401 Unauthorized if not authenticated
 * @returns 500 Internal Server Error on server failure
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build where clause based on status filter
    const whereClause: any = {
      userId: session.user.id,
    };

    if (status === 'active') {
      whereClause.deathDate = null;
    } else if (status === 'deceased') {
      whereClause.deathDate = { not: null };
    }
    // For "all", no deathDate filter needed

    // Query chickens
    const chickens = await prisma.chicken.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
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
        // Exclude photo buffer from list response for performance
      },
    });

    return NextResponse.json(chickens, { status: 200 });
  } catch (error) {
    console.error('Error fetching chickens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chickens. Please try again.' },
      { status: 500 }
    );
  }
}
