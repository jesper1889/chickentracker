/**
 * Egg Production Monthly Aggregation API Route
 *
 * GET /api/egg-production/monthly - Return aggregated monthly totals for last 6 months
 *
 * Authentication: Required
 * Authorization: Returns only authenticated user's data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/egg-production/monthly
 *
 * Return aggregated egg production data for the last 6 months.
 * Groups entries by month and returns total count and days recorded.
 *
 * @returns 200 OK with array of monthly aggregates
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

    // Calculate date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Set to first day of the month

    // Query all entries for the user in the last 6 months
    const entries = await prisma.eggProduction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        date: true,
        count: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group entries by month (YYYY-MM)
    const monthlyMap = new Map<
      string,
      { totalCount: number; daysRecorded: number }
    >();

    for (const entry of entries) {
      // Get year-month in YYYY-MM format
      const year = entry.date.getFullYear();
      const month = String(entry.date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      // Initialize or update month entry
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { totalCount: 0, daysRecorded: 0 });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.totalCount += entry.count;
      monthData.daysRecorded += 1;
    }

    // Convert map to sorted array (most recent first)
    const monthlyData = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        totalCount: data.totalCount,
        daysRecorded: data.daysRecorded,
      }))
      .sort((a, b) => b.month.localeCompare(a.month)); // Sort descending (most recent first)

    return NextResponse.json(monthlyData, { status: 200 });
  } catch (error) {
    console.error('Error fetching monthly aggregation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly data. Please try again.' },
      { status: 500 }
    );
  }
}
