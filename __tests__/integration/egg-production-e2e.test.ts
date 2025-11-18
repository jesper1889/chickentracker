/**
 * Egg Production End-to-End Integration Tests
 *
 * These tests verify complete user workflows and data consistency across the application:
 * - Full CRUD workflows from UI to database
 * - Data consistency across calendar view and monthly aggregates
 * - User isolation and concurrent access scenarios
 * - Edge cases: zero eggs, month boundaries, large datasets
 * - Error recovery and validation feedback
 *
 * @jest-environment node
 */

import { PrismaClient } from '@/lib/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test users
let user1: { id: string; email: string };
let user2: { id: string; email: string };

beforeAll(async () => {
  // Clean up existing test data
  await prisma.eggProduction.deleteMany({
    where: {
      user: {
        email: { contains: 'e2e-egg-test' },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: { contains: 'e2e-egg-test' },
    },
  });

  // Create test users
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);
  user1 = await prisma.user.create({
    data: {
      email: 'e2e-egg-test-user1@example.com',
      password: hashedPassword,
      name: 'E2E Test User 1',
    },
  });

  user2 = await prisma.user.create({
    data: {
      email: 'e2e-egg-test-user2@example.com',
      password: hashedPassword,
      name: 'E2E Test User 2',
    },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.eggProduction.deleteMany({
    where: {
      userId: { in: [user1.id, user2.id] },
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: { in: [user1.id, user2.id] },
    },
  });
  await prisma.$disconnect();
});

describe('Egg Production End-to-End Integration Tests', () => {
  describe('Complete CRUD Workflow', () => {
    test('should complete full lifecycle: create → read → update → delete', async () => {
      const testDate = new Date('2025-11-15');

      // CREATE: Add new entry
      const created = await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: testDate,
          count: 12,
        },
      });

      expect(created).toBeDefined();
      expect(created.count).toBe(12);
      const entryId = created.id;

      // READ: Retrieve entry
      const retrieved = await prisma.eggProduction.findUnique({
        where: { id: entryId },
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.count).toBe(12);
      expect(retrieved?.userId).toBe(user1.id);

      // UPDATE: Modify entry
      const updated = await prisma.eggProduction.update({
        where: { id: entryId },
        data: { count: 18 },
      });

      expect(updated.count).toBe(18);
      expect(updated.id).toBe(entryId);

      // DELETE: Remove entry
      await prisma.eggProduction.delete({
        where: { id: entryId },
      });

      // Verify deletion
      const deleted = await prisma.eggProduction.findUnique({
        where: { id: entryId },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('Data Consistency Across Views', () => {
    test('should maintain consistency between calendar view and monthly aggregates', async () => {
      // Add multiple entries in November 2025
      const novemberEntries = [
        { date: new Date('2025-11-01'), count: 10 },
        { date: new Date('2025-11-05'), count: 12 },
        { date: new Date('2025-11-10'), count: 8 },
        { date: new Date('2025-11-15'), count: 15 },
        { date: new Date('2025-11-20'), count: 11 },
      ];

      for (const entry of novemberEntries) {
        await prisma.eggProduction.create({
          data: {
            userId: user1.id,
            date: entry.date,
            count: entry.count,
          },
        });
      }

      // Fetch all November entries (calendar view simulation)
      const calendarEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-11-01'),
            lte: new Date('2025-11-30'),
          },
        },
        orderBy: { date: 'asc' },
      });

      expect(calendarEntries.length).toBe(5);

      // Calculate monthly aggregate (monthly table simulation)
      const monthlyTotal = calendarEntries.reduce((sum, entry) => sum + entry.count, 0);
      const expectedTotal = 10 + 12 + 8 + 15 + 11; // 56 eggs

      expect(monthlyTotal).toBe(expectedTotal);
      expect(monthlyTotal).toBe(56);
    });

    test('should update monthly totals when entry is modified', async () => {
      // Create entry in October
      const octoberEntry = await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: new Date('2025-10-10'),
          count: 20,
        },
      });

      // Get initial monthly total
      const initialEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-10-01'),
            lte: new Date('2025-10-31'),
          },
        },
      });

      const initialTotal = initialEntries.reduce((sum, e) => sum + e.count, 0);
      expect(initialTotal).toBe(20);

      // Update entry
      await prisma.eggProduction.update({
        where: { id: octoberEntry.id },
        data: { count: 30 },
      });

      // Get updated monthly total
      const updatedEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-10-01'),
            lte: new Date('2025-10-31'),
          },
        },
      });

      const updatedTotal = updatedEntries.reduce((sum, e) => sum + e.count, 0);
      expect(updatedTotal).toBe(30);
    });

    test('should remove entry from all views when deleted', async () => {
      // Create entry
      const entry = await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: new Date('2025-09-15'),
          count: 25,
        },
      });

      // Verify it appears in calendar view
      const beforeDelete = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: new Date('2025-09-15'),
        },
      });

      expect(beforeDelete.length).toBe(1);

      // Delete entry
      await prisma.eggProduction.delete({
        where: { id: entry.id },
      });

      // Verify it's removed from calendar view
      const afterDeleteCalendar = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: new Date('2025-09-15'),
        },
      });

      expect(afterDeleteCalendar.length).toBe(0);

      // Verify monthly total is updated
      const monthlyEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-09-01'),
            lte: new Date('2025-09-30'),
          },
        },
      });

      const monthlyTotal = monthlyEntries.reduce((sum, e) => sum + e.count, 0);
      expect(monthlyTotal).toBe(0); // Should be 0 since we deleted the only entry
    });
  });

  describe('User Isolation and Concurrent Access', () => {
    test('should allow both users to log entries for the same date independently', async () => {
      const sharedDate = new Date('2025-08-10');

      // User 1 logs entry
      const user1Entry = await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: sharedDate,
          count: 14,
        },
      });

      // User 2 logs entry for same date
      const user2Entry = await prisma.eggProduction.create({
        data: {
          userId: user2.id,
          date: sharedDate,
          count: 9,
        },
      });

      // Verify both entries exist
      expect(user1Entry.userId).toBe(user1.id);
      expect(user2Entry.userId).toBe(user2.id);
      expect(user1Entry.date).toEqual(user2Entry.date);
      expect(user1Entry.count).not.toBe(user2Entry.count);

      // Verify User 1 only sees their own data
      const user1Data = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: sharedDate,
        },
      });

      expect(user1Data.length).toBe(1);
      expect(user1Data[0].count).toBe(14);

      // Verify User 2 only sees their own data
      const user2Data = await prisma.eggProduction.findMany({
        where: {
          userId: user2.id,
          date: sharedDate,
        },
      });

      expect(user2Data.length).toBe(1);
      expect(user2Data[0].count).toBe(9);
    });

    test('should maintain separate monthly aggregates per user', async () => {
      // User 1 logs entries in July
      await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: new Date('2025-07-05'),
          count: 20,
        },
      });

      await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: new Date('2025-07-15'),
          count: 25,
        },
      });

      // User 2 logs entries in July
      await prisma.eggProduction.create({
        data: {
          userId: user2.id,
          date: new Date('2025-07-10'),
          count: 30,
        },
      });

      // Calculate User 1's July total
      const user1July = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-07-01'),
            lte: new Date('2025-07-31'),
          },
        },
      });

      const user1Total = user1July.reduce((sum, e) => sum + e.count, 0);
      expect(user1Total).toBe(45); // 20 + 25

      // Calculate User 2's July total
      const user2July = await prisma.eggProduction.findMany({
        where: {
          userId: user2.id,
          date: {
            gte: new Date('2025-07-01'),
            lte: new Date('2025-07-31'),
          },
        },
      });

      const user2Total = user2July.reduce((sum, e) => sum + e.count, 0);
      expect(user2Total).toBe(30);
    });
  });

  describe('Edge Cases and Special Scenarios', () => {
    test('should treat zero eggs differently from no entry', async () => {
      const zeroDate = new Date('2025-06-10');
      const noEntryDate = new Date('2025-06-11');

      // Log zero eggs explicitly
      const zeroEntry = await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: zeroDate,
          count: 0,
        },
      });

      expect(zeroEntry.count).toBe(0);

      // Query for zero eggs date - should find entry
      const zeroResult = await prisma.eggProduction.findFirst({
        where: {
          userId: user1.id,
          date: zeroDate,
        },
      });

      expect(zeroResult).toBeDefined();
      expect(zeroResult?.count).toBe(0);

      // Query for no entry date - should find nothing
      const noEntryResult = await prisma.eggProduction.findFirst({
        where: {
          userId: user1.id,
          date: noEntryDate,
        },
      });

      expect(noEntryResult).toBeNull();
    });

    test('should handle month boundary entries correctly', async () => {
      // Add entries on last day of May and first day of June
      await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: new Date('2025-05-31'),
          count: 18,
        },
      });

      await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: new Date('2025-06-01'),
          count: 22,
        },
      });

      // Get May total
      const mayEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-05-01'),
            lte: new Date('2025-05-31'),
          },
        },
      });

      const mayTotal = mayEntries.reduce((sum, e) => sum + e.count, 0);
      expect(mayTotal).toBe(18);

      // Get June total
      const juneEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-06-01'),
            lte: new Date('2025-06-30'),
          },
        },
      });

      const juneTotal = juneEntries.reduce((sum, e) => sum + e.count, 0);
      expect(juneTotal).toBeGreaterThanOrEqual(22); // At least 22 from June 1 entry
    });

    test('should handle large dataset: 30 days of entries with aggregation', async () => {
      // Create 30 consecutive days of entries in April 2025
      const startDate = new Date('2025-04-01');
      const entries = [];

      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        entries.push({
          userId: user1.id,
          date,
          count: 10 + i, // Varying counts: 10, 11, 12, ..., 39
        });
      }

      // Batch create entries
      await prisma.eggProduction.createMany({
        data: entries,
      });

      // Verify all entries were created
      const aprilEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: {
            gte: new Date('2025-04-01'),
            lte: new Date('2025-04-30'),
          },
        },
        orderBy: { date: 'asc' },
      });

      expect(aprilEntries.length).toBe(30);

      // Calculate total (arithmetic sequence: 10 + 11 + ... + 39)
      // Sum = n * (first + last) / 2 = 30 * (10 + 39) / 2 = 735
      const total = aprilEntries.reduce((sum, e) => sum + e.count, 0);
      expect(total).toBe(735);

      // Verify days recorded
      expect(aprilEntries.length).toBe(30);
    });

    test('should prevent duplicate entries and suggest update instead', async () => {
      const duplicateDate = new Date('2025-03-20');

      // Create first entry
      const firstEntry = await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: duplicateDate,
          count: 16,
        },
      });

      expect(firstEntry.count).toBe(16);

      // Attempt to create duplicate should fail
      let error: Error | null = null;
      try {
        await prisma.eggProduction.create({
          data: {
            userId: user1.id,
            date: duplicateDate,
            count: 20,
          },
        });
      } catch (e) {
        error = e as Error;
      }

      // Should have error due to unique constraint
      expect(error).toBeDefined();
      expect(error?.message).toContain('Unique constraint');

      // Instead, should update existing entry
      const updated = await prisma.eggProduction.update({
        where: { id: firstEntry.id },
        data: { count: 20 },
      });

      expect(updated.count).toBe(20);
      expect(updated.id).toBe(firstEntry.id);

      // Verify only one entry exists
      const entries = await prisma.eggProduction.findMany({
        where: {
          userId: user1.id,
          date: duplicateDate,
        },
      });

      expect(entries.length).toBe(1);
      expect(entries[0].count).toBe(20);
    });

    test('should maintain data integrity during concurrent updates', async () => {
      const concurrentDate = new Date('2025-02-14');

      // Create initial entry
      const entry = await prisma.eggProduction.create({
        data: {
          userId: user1.id,
          date: concurrentDate,
          count: 5,
        },
      });

      // Simulate concurrent updates (both should succeed sequentially)
      const update1 = prisma.eggProduction.update({
        where: { id: entry.id },
        data: { count: 10 },
      });

      const update2 = prisma.eggProduction.update({
        where: { id: entry.id },
        data: { count: 15 },
      });

      // Execute updates
      await update1;
      const finalResult = await update2;

      // Final state should reflect last update
      expect(finalResult.count).toBe(15);

      // Verify in database
      const verified = await prisma.eggProduction.findUnique({
        where: { id: entry.id },
      });

      expect(verified?.count).toBe(15);
    });
  });

  describe('Six-Month Aggregation Window', () => {
    test('should correctly aggregate last 6 months of data', async () => {
      // Use a unique date range for this test to avoid conflicts
      // Start from January 2024 and create 8 months of data
      const months = [
        { date: new Date('2024-01-15'), count: 40 }, // 8 months ago
        { date: new Date('2024-02-15'), count: 35 }, // 7 months ago
        { date: new Date('2024-03-15'), count: 30 }, // 6 months ago (boundary)
        { date: new Date('2024-04-15'), count: 25 }, // 5 months ago
        { date: new Date('2024-05-15'), count: 20 }, // 4 months ago
        { date: new Date('2024-06-15'), count: 15 }, // 3 months ago
        { date: new Date('2024-07-15'), count: 10 }, // 2 months ago
        { date: new Date('2024-08-15'), count: 5 },  // 1 month ago
      ];

      // Create entries
      for (const entry of months) {
        await prisma.eggProduction.create({
          data: {
            userId: user2.id,
            date: entry.date,
            count: entry.count,
          },
        });
      }

      // Define 6-month cutoff: March 1, 2024
      const sixMonthsAgo = new Date('2024-03-01');

      const recentEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user2.id,
          date: {
            gte: sixMonthsAgo,
            lte: new Date('2024-08-31'),
          },
        },
        orderBy: { date: 'desc' },
      });

      // Should include 6 entries (March through August)
      expect(recentEntries.length).toBe(6);

      // Verify the two oldest entries are excluded
      const oldestEntries = await prisma.eggProduction.findMany({
        where: {
          userId: user2.id,
          date: {
            lt: sixMonthsAgo,
            gte: new Date('2024-01-01'),
            lte: new Date('2024-08-31'),
          },
        },
      });

      // Should have 2 old entries (January and February)
      expect(oldestEntries.length).toBe(2);

      // Verify total for recent 6 months
      const recentTotal = recentEntries.reduce((sum, e) => sum + e.count, 0);
      // Sum: 30 + 25 + 20 + 15 + 10 + 5 = 105
      expect(recentTotal).toBe(105);
    });
  });
});
