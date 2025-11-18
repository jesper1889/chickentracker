/**
 * Individual Egg Production API Routes
 *
 * PUT /api/egg-production/[id] - Update existing daily egg count entry
 * DELETE /api/egg-production/[id] - Remove entry
 *
 * Authentication: Required for all operations
 * Authorization: Users can only access their own entries
 *
 * Error Handling:
 * - 400: Validation errors with field-level details
 * - 401: Unauthenticated requests
 * - 403: Unauthorized access (entry belongs to another user)
 * - 404: Entry not found
 * - 500: Server errors
 *
 * Response Format:
 * Success: { id, userId, date, count, createdAt, updatedAt }
 * Error: { error: string, details?: [{ field: string, message: string }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { eggProductionSchema } from '@/lib/validations/egg-production';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

/**
 * Maps Zod validation errors to user-friendly error messages
 * Ensures validation errors are clear and actionable
 */
function formatZodError(issue: any): { field: string; message: string } {
  const field = issue.path.join('.');

  // Map common validation error patterns to user-friendly messages
  const messageMap: Record<string, Record<string, string>> = {
    count: {
      'Count must be a whole number': 'Egg count must be a whole number (no decimals).',
      'Count cannot be negative': 'Egg count cannot be negative. It must be 0 or greater.',
    },
    date: {
      'Date cannot be in the future': 'You cannot log eggs for a future date. Please select today or an earlier date.',
    },
  };

  // Try to find a user-friendly message
  const fieldMessages = messageMap[field];
  if (fieldMessages && fieldMessages[issue.message]) {
    return {
      field,
      message: fieldMessages[issue.message],
    };
  }

  // Fallback to original message
  return {
    field,
    message: issue.message,
  };
}

/**
 * PUT /api/egg-production/[id]
 *
 * Update an existing egg production entry.
 * Verifies the entry belongs to the authenticated user.
 *
 * Request body:
 * {
 *   date: ISO date string (YYYY-MM-DD),
 *   count: number (non-negative integer)
 * }
 *
 * @param params - Route parameters containing entry id
 * @returns 200 OK with updated entry data on success
 * @returns 400 Bad Request if validation fails or duplicate date for user
 * @returns 401 Unauthorized if not authenticated
 * @returns 403 Forbidden if entry belongs to different user
 * @returns 404 Not Found if entry doesn't exist
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

    // Get existing entry to verify ownership
    const existingEntry = await prisma.eggProduction.findUnique({
      where: { id },
    });

    // Return 404 if not found
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found.' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Forbidden. You don\'t have permission to modify this entry.',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Parse date if it's a string (from JSON)
    let dateValue = body.date;
    if (typeof dateValue === 'string') {
      dateValue = new Date(dateValue);
    }

    // Validate egg production data with Zod schema
    const validated = eggProductionSchema.parse({
      date: dateValue,
      count: body.count,
    });

    // Update entry in database
    const updatedEntry = await prisma.eggProduction.update({
      where: { id },
      data: {
        date: validated.date,
        count: validated.count,
      },
    });

    return NextResponse.json(updatedEntry, { status: 200 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(formatZodError),
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violation (duplicate date for user, different entry)
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      return NextResponse.json(
        {
          error: 'An entry already exists for this date',
          details: [
            {
              field: 'date',
              message: 'You already have an entry for this date. Please select a different date or edit the existing entry.',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Error updating egg production entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/egg-production/[id]
 *
 * Delete an egg production entry.
 * Verifies the entry belongs to the authenticated user.
 *
 * @param params - Route parameters containing entry id
 * @returns 204 No Content on successful deletion
 * @returns 401 Unauthorized if not authenticated
 * @returns 403 Forbidden if entry belongs to different user
 * @returns 404 Not Found if entry doesn't exist
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

    // Get entry to verify ownership
    const entry = await prisma.eggProduction.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    // Return 404 if not found
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found.' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (entry.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Forbidden. You don\'t have permission to delete this entry.',
        },
        { status: 403 }
      );
    }

    // Delete entry
    await prisma.eggProduction.delete({
      where: { id },
    });

    // Return 204 No Content (no body)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting egg production entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry. Please try again.' },
      { status: 500 }
    );
  }
}
