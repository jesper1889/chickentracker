/**
 * Egg Production API Routes - Create and List
 *
 * POST /api/egg-production - Create/log egg count for a specific date
 * GET /api/egg-production - List entries with optional date range filters
 *
 * Authentication: Required for all operations
 * Authorization: Users can only access/modify their own data
 *
 * Error Handling:
 * - 400: Validation errors with field-level details
 * - 401: Unauthenticated requests
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
 * POST /api/egg-production
 *
 * Create a new egg production entry for a specific date.
 * Each user can only have one entry per day (unique constraint enforced).
 *
 * Request body:
 * {
 *   date: ISO date string (YYYY-MM-DD),
 *   count: number (non-negative integer)
 * }
 *
 * @returns 201 Created with egg production entry on success
 * @returns 400 Bad Request if validation fails or duplicate date for user
 * @returns 401 Unauthorized if not authenticated
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

    // Create egg production entry in database
    const entry = await prisma.eggProduction.create({
      data: {
        userId: session.user.id,
        date: validated.date,
        count: validated.count,
      },
    });

    return NextResponse.json(entry, { status: 201 });
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

    // Handle Prisma unique constraint violation (duplicate date for user)
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
              message: 'You already have an entry for this date. Please edit the existing entry instead.',
            },
          ],
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Error creating egg production entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/egg-production
 *
 * List egg production entries for the authenticated user.
 * Supports optional date range filtering via query parameters.
 *
 * Query Parameters:
 * - startDate: ISO date string (YYYY-MM-DD) - filter entries on or after this date
 * - endDate: ISO date string (YYYY-MM-DD) - filter entries on or before this date
 *
 * @returns 200 OK with array of egg production entries
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
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Build where clause with date range filters if provided
    const whereClause: any = {
      userId: session.user.id,
    };

    if (startDateStr || endDateStr) {
      whereClause.date = {};
      if (startDateStr) {
        whereClause.date.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        whereClause.date.lte = new Date(endDateStr);
      }
    }

    // Query egg production entries
    const entries = await prisma.eggProduction.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(entries, { status: 200 });
  } catch (error) {
    console.error('Error fetching egg production entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries. Please try again.' },
      { status: 500 }
    );
  }
}
