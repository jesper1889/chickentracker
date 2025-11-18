/**
 * Individual Chicken API Routes
 *
 * GET /api/chickens/[id] - Retrieve single chicken
 * PUT /api/chickens/[id] - Update chicken with optional photo
 * DELETE /api/chickens/[id] - Delete chicken
 *
 * Authentication: Required for all operations
 * Authorization: Users can only access their own chickens
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
 * GET /api/chickens/[id]
 *
 * Retrieve a single chicken by ID.
 * Verifies the chicken belongs to the authenticated user.
 *
 * @param params - Route parameters containing chicken id
 * @returns 200 OK with chicken data on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 403 Forbidden if chicken belongs to different user
 * @returns 404 Not Found if chicken doesn't exist
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

    // Get chicken by ID
    const chicken = await prisma.chicken.findUnique({
      where: { id },
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
        { error: 'Forbidden. You can only access your own chickens.' },
        { status: 403 }
      );
    }

    return NextResponse.json(chicken, { status: 200 });
  } catch (error) {
    console.error('Error fetching chicken:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chicken. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chickens/[id]
 *
 * Update a chicken's information.
 * Supports photo replacement and removal.
 * Supports multipart/form-data for photo uploads.
 *
 * @param params - Route parameters containing chicken id
 * @returns 200 OK with updated chicken data on success
 * @returns 401 Unauthorized if not authenticated
 * @returns 403 Forbidden if chicken belongs to different user
 * @returns 404 Not Found if chicken doesn't exist
 * @returns 400 Bad Request if validation fails
 * @returns 500 Internal Server Error on server failure
 */
export async function PUT(
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

    // Get existing chicken to verify ownership
    const existingChicken = await prisma.chicken.findUnique({
      where: { id },
    });

    // Return 404 if not found
    if (!existingChicken) {
      return NextResponse.json(
        { error: 'Chicken not found.' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingChicken.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only update your own chickens.' },
        { status: 403 }
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
    const removePhoto = formData.get('removePhoto') === 'true';

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

    // Handle photo update
    let photoBuffer: Buffer | null | undefined;
    let photoMimeType: string | null | undefined;

    if (removePhoto) {
      // Remove photo
      photoBuffer = null;
      photoMimeType = null;
    } else if (photoFile && photoFile.size > 0) {
      // Replace photo with new upload
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
    // If neither removePhoto nor new photoFile, keep existing photo (undefined)

    // Build update data
    const updateData: any = {
      name: validated.name,
      breed: validated.breed || null,
      sex: validated.sex || null,
      birthDate: validated.birthDate || null,
      deathDate: validated.deathDate || null,
      notes: validated.notes || null,
    };

    // Only update photo fields if they were explicitly changed
    if (photoBuffer !== undefined) {
      updateData.photo = photoBuffer ? Uint8Array.from(photoBuffer) : null;
      updateData.photoMimeType = photoMimeType;
    }

    // Update chicken in database
    const updatedChicken = await prisma.chicken.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating chicken:', error);
    return NextResponse.json(
      { error: 'Failed to update chicken. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chickens/[id]
 *
 * Delete a chicken profile.
 * Verifies the chicken belongs to the authenticated user.
 *
 * @param params - Route parameters containing chicken id
 * @returns 204 No Content on successful deletion
 * @returns 401 Unauthorized if not authenticated
 * @returns 403 Forbidden if chicken belongs to different user
 * @returns 404 Not Found if chicken doesn't exist
 * @returns 500 Internal Server Error on server failure
 */
export async function DELETE(
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

    // Get chicken to verify ownership
    const chicken = await prisma.chicken.findUnique({
      where: { id },
      select: { id: true, userId: true },
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
        { error: 'Forbidden. You can only delete your own chickens.' },
        { status: 403 }
      );
    }

    // Delete chicken
    await prisma.chicken.delete({
      where: { id },
    });

    // Return 204 No Content (no body)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting chicken:', error);
    return NextResponse.json(
      { error: 'Failed to delete chicken. Please try again.' },
      { status: 500 }
    );
  }
}
