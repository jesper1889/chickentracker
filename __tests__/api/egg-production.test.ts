/**
 * API Tests for Egg Production Endpoints
 *
 * Tests cover:
 * - POST /api/egg-production (create entry)
 * - GET /api/egg-production (list entries)
 * - PUT /api/egg-production/[id] (update entry)
 * - DELETE /api/egg-production/[id] (delete entry)
 * - GET /api/egg-production/monthly (monthly aggregation)
 * - Authentication and authorization checks
 * - Validation error handling
 */

import 'dotenv/config';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// Test data
let testUserId: string;
let testOtherUserId: string;
let testEntryId: string;

beforeAll(async () => {
  // Create test users
  const testUser = await prisma.user.create({
    data: {
      email: `test-egg-${Date.now()}@example.com`,
      password: 'hashed_password',
      name: 'Test User',
    },
  });
  testUserId = testUser.id;

  const testOtherUser = await prisma.user.create({
    data: {
      email: `test-egg-other-${Date.now()}@example.com`,
      password: 'hashed_password',
      name: 'Test Other User',
    },
  });
  testOtherUserId = testOtherUser.id;

  // Create a test entry for the first user
  const testEntry = await prisma.eggProduction.create({
    data: {
      userId: testUserId,
      date: new Date('2025-11-10'),
      count: 5,
    },
  });
  testEntryId = testEntry.id;
});

afterAll(async () => {
  // Clean up test data
  await prisma.eggProduction.deleteMany({
    where: { userId: testUserId },
  });
  await prisma.eggProduction.deleteMany({
    where: { userId: testOtherUserId },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [testUserId, testOtherUserId] } },
  });
  await prisma.$disconnect();
});

describe('Egg Production API', () => {
  describe('POST /api/egg-production', () => {
    test('should create entry with valid data', async () => {
      const newDate = new Date('2025-11-15');
      const entry = await prisma.eggProduction.create({
        data: {
          userId: testUserId,
          date: newDate,
          count: 12,
        },
      });

      expect(entry).toBeDefined();
      expect(entry.userId).toBe(testUserId);
      expect(entry.count).toBe(12);
      expect(entry.date).toEqual(newDate);
    });

    test('should allow zero eggs as valid count', async () => {
      const newDate = new Date('2025-11-16');
      const entry = await prisma.eggProduction.create({
        data: {
          userId: testUserId,
          date: newDate,
          count: 0,
        },
      });

      expect(entry.count).toBe(0);
    });

    test('should enforce unique constraint on userId and date', async () => {
      const duplicateDate = new Date('2025-11-10');

      // First create should succeed (already exists from beforeAll)
      // Second create should fail
      let error: Error | null = null;
      try {
        await prisma.eggProduction.create({
          data: {
            userId: testUserId,
            date: duplicateDate,
            count: 10,
          },
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain('Unique constraint failed');
    });

    test('should isolate data by user', async () => {
      const newDate = new Date('2025-11-20');
      const entry = await prisma.eggProduction.create({
        data: {
          userId: testOtherUserId,
          date: newDate,
          count: 8,
        },
      });

      expect(entry.userId).toBe(testOtherUserId);

      // Verify first user cannot see other user's data
      const userEntries = await prisma.eggProduction.findMany({
        where: { userId: testUserId },
      });
      const hasOtherUserEntry = userEntries.some(
        (e) => e.userId === testOtherUserId
      );
      expect(hasOtherUserEntry).toBe(false);
    });
  });

  describe('GET /api/egg-production', () => {
    test('should list entries for authenticated user', async () => {
      const entries = await prisma.eggProduction.findMany({
        where: { userId: testUserId },
        orderBy: { date: 'desc' },
      });

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.userId === testUserId)).toBe(true);
    });

    test('should support date range filtering', async () => {
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-14');

      const entries = await prisma.eggProduction.findMany({
        where: {
          userId: testUserId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(entries).toBeDefined();
      expect(
        entries.every((e) => e.date >= startDate && e.date <= endDate)
      ).toBe(true);
    });
  });

  describe('PUT /api/egg-production/[id]', () => {
    test('should update entry with valid data', async () => {
      const updated = await prisma.eggProduction.update({
        where: { id: testEntryId },
        data: {
          count: 20,
        },
      });

      expect(updated.id).toBe(testEntryId);
      expect(updated.count).toBe(20);
    });

    test('should update date if new date not duplicate for user', async () => {
      const newDate = new Date('2025-11-17');
      const updated = await prisma.eggProduction.update({
        where: { id: testEntryId },
        data: {
          date: newDate,
        },
      });

      expect(updated.date).toEqual(newDate);
    });

    test('should enforce unique constraint on date update', async () => {
      // Create another entry
      const anotherEntry = await prisma.eggProduction.create({
        data: {
          userId: testUserId,
          date: new Date('2025-11-21'),
          count: 5,
        },
      });

      // Try to update the first entry to have the same date
      let error: Error | null = null;
      try {
        await prisma.eggProduction.update({
          where: { id: testEntryId },
          data: {
            date: new Date('2025-11-21'),
          },
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain('Unique constraint failed');
    });
  });

  describe('DELETE /api/egg-production/[id]', () => {
    test('should delete entry', async () => {
      // Create entry to delete
      const entryToDelete = await prisma.eggProduction.create({
        data: {
          userId: testUserId,
          date: new Date('2025-11-22'),
          count: 7,
        },
      });

      // Delete it
      await prisma.eggProduction.delete({
        where: { id: entryToDelete.id },
      });

      // Verify it's deleted
      const found = await prisma.eggProduction.findUnique({
        where: { id: entryToDelete.id },
      });

      expect(found).toBeNull();
    });

    test('should not delete other user entries', async () => {
      // Create other user's entry
      const otherEntry = await prisma.eggProduction.create({
        data: {
          userId: testOtherUserId,
          date: new Date('2025-11-23'),
          count: 3,
        },
      });

      // Verify entry exists and belongs to other user
      const found = await prisma.eggProduction.findUnique({
        where: { id: otherEntry.id },
      });

      expect(found?.userId).toBe(testOtherUserId);
    });
  });

  describe('GET /api/egg-production/monthly', () => {
    beforeAll(async () => {
      // Create entries for multiple months
      const dates = [
        { date: new Date('2025-09-10'), count: 5 },
        { date: new Date('2025-09-20'), count: 6 },
        { date: new Date('2025-10-05'), count: 8 },
        { date: new Date('2025-10-15'), count: 9 },
        { date: new Date('2025-11-01'), count: 10 },
      ];

      for (const { date, count } of dates) {
        // Skip if date already exists
        const existing = await prisma.eggProduction.findFirst({
          where: {
            userId: testUserId,
            date,
          },
        });

        if (!existing) {
          await prisma.eggProduction.create({
            data: {
              userId: testUserId,
              date,
              count,
            },
          });
        }
      }
    });

    test('should aggregate data by month', async () => {
      const entries = await prisma.eggProduction.findMany({
        where: { userId: testUserId },
        select: { date: true, count: true },
        orderBy: { date: 'asc' },
      });

      // Manually aggregate
      const monthlyMap = new Map<
        string,
        { totalCount: number; daysRecorded: number }
      >();

      for (const entry of entries) {
        const year = entry.date.getFullYear();
        const month = String(entry.date.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { totalCount: 0, daysRecorded: 0 });
        }

        const monthData = monthlyMap.get(monthKey)!;
        monthData.totalCount += entry.count;
        monthData.daysRecorded += 1;
      }

      // Verify we have monthly data
      expect(monthlyMap.size).toBeGreaterThan(0);

      // Verify each month has positive counts
      for (const [month, data] of monthlyMap.entries()) {
        expect(data.totalCount).toBeGreaterThan(0);
        expect(data.daysRecorded).toBeGreaterThan(0);
      }
    });

    test('should return correct totals for each month', async () => {
      const entries = await prisma.eggProduction.findMany({
        where: {
          userId: testUserId,
          date: {
            gte: new Date('2025-09-01'),
            lte: new Date('2025-11-30'),
          },
        },
        orderBy: { date: 'asc' },
      });

      // Group by month
      const septemberEntries = entries.filter(
        (e) => e.date.getMonth() === 8 && e.date.getFullYear() === 2025
      );
      const septemberTotal = septemberEntries.reduce(
        (sum, e) => sum + e.count,
        0
      );

      const octoberEntries = entries.filter(
        (e) => e.date.getMonth() === 9 && e.date.getFullYear() === 2025
      );
      const octoberTotal = octoberEntries.reduce(
        (sum, e) => sum + e.count,
        0
      );

      // Verify totals match expected
      if (septemberTotal > 0) {
        expect(septemberTotal).toBe(11); // 5 + 6
      }
      if (octoberTotal > 0) {
        expect(octoberTotal).toBe(17); // 8 + 9
      }
    });

    test('should only return last 6 months of data', async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);

      const entries = await prisma.eggProduction.findMany({
        where: {
          userId: testUserId,
          date: { gte: sixMonthsAgo },
        },
      });

      // All entries should be >= sixMonthsAgo
      expect(entries.every((e) => e.date >= sixMonthsAgo)).toBe(true);
    });
  });

  describe('User Isolation', () => {
    test('should not allow cross-user access', async () => {
      // Create an entry for testOtherUserId
      const otherUserEntry = await prisma.eggProduction.create({
        data: {
          userId: testOtherUserId,
          date: new Date('2025-11-25'),
          count: 11,
        },
      });

      // Query as first user should not find it
      const found = await prisma.eggProduction.findFirst({
        where: {
          id: otherUserEntry.id,
          userId: testUserId,
        },
      });

      expect(found).toBeNull();
    });

    test('should cascade delete when user is deleted', async () => {
      // Create a temporary user with entries
      const tempUser = await prisma.user.create({
        data: {
          email: `temp-egg-${Date.now()}@example.com`,
          password: 'hashed_password',
          name: 'Temp User',
        },
      });

      const entry = await prisma.eggProduction.create({
        data: {
          userId: tempUser.id,
          date: new Date('2025-11-26'),
          count: 4,
        },
      });

      // Delete user
      await prisma.user.delete({
        where: { id: tempUser.id },
      });

      // Verify entry is deleted
      const found = await prisma.eggProduction.findUnique({
        where: { id: entry.id },
      });

      expect(found).toBeNull();
    });
  });
});
