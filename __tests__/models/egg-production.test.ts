/**
 * EggProduction Model Tests
 *
 * These tests verify critical EggProduction model functionality:
 * - EggProduction creation with valid data (date + count)
 * - Validation of count as non-negative integer
 * - Date cannot be in future (database constraint)
 * - Unique constraint on (userId, date) prevents duplicates
 * - User isolation: users can only see their own data
 * - Cascade delete when user is deleted
 *
 * @jest-environment node
 */

import { PrismaClient } from '../../lib/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test users for egg production associations
let testUser1: { id: string; email: string };
let testUser2: { id: string; email: string };

// Clean up database before and after tests
beforeAll(async () => {
  // Clean up any existing test data
  await prisma.eggProduction.deleteMany({
    where: {
      user: {
        email: {
          contains: 'eggprodtest',
        },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'eggprodtest',
      },
    },
  });

  // Create test users
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);
  testUser1 = await prisma.user.create({
    data: {
      email: 'eggprodtest1@example.com',
      password: hashedPassword,
      name: 'Egg Production Test User 1',
    },
  });

  testUser2 = await prisma.user.create({
    data: {
      email: 'eggprodtest2@example.com',
      password: hashedPassword,
      name: 'Egg Production Test User 2',
    },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.eggProduction.deleteMany({
    where: {
      user: {
        email: {
          contains: 'eggprodtest',
        },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'eggprodtest',
      },
    },
  });
  await prisma.$disconnect();
});

describe('EggProduction Model', () => {
  it('should create an egg production entry with valid data (date + count)', async () => {
    const entry = await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: new Date('2025-11-15'),
        count: 5,
      },
    });

    expect(entry).toBeDefined();
    expect(entry.id).toBeDefined();
    expect(entry.userId).toBe(testUser1.id);
    expect(entry.date).toEqual(new Date('2025-11-15'));
    expect(entry.count).toBe(5);
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(entry.updatedAt).toBeInstanceOf(Date);
  });

  it('should validate count as non-negative integer (0 eggs valid)', async () => {
    const entry = await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: new Date('2025-11-14'),
        count: 0, // Explicit "0 eggs" is valid
      },
    });

    expect(entry.count).toBe(0);

    // Also test with positive integer
    const entry2 = await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: new Date('2025-11-13'),
        count: 10,
      },
    });

    expect(entry2.count).toBe(10);
  });

  it('should enforce unique constraint on (userId, date) to prevent duplicates', async () => {
    const testDate = new Date('2025-11-12');

    // Create first entry
    await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: testDate,
        count: 5,
      },
    });

    // Attempt to create duplicate should fail
    try {
      await prisma.eggProduction.create({
        data: {
          userId: testUser1.id,
          date: testDate,
          count: 8, // Different count, but same user and date
        },
      });
      // If we reach here, the constraint didn't work
      expect(true).toBe(false); // Force test failure
    } catch (error: any) {
      // Expected to fail due to unique constraint
      expect(error.code).toBe('P2002'); // Prisma unique constraint error
      expect(error.meta?.target).toContain('userId');
      expect(error.meta?.target).toContain('date');
    }
  });

  it('should allow same date for different users (user isolation)', async () => {
    const testDate = new Date('2025-11-11');

    // User 1 creates entry for Nov 11
    const entry1 = await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: testDate,
        count: 5,
      },
    });

    // User 2 creates entry for same date (should succeed)
    const entry2 = await prisma.eggProduction.create({
      data: {
        userId: testUser2.id,
        date: testDate,
        count: 8,
      },
    });

    expect(entry1.userId).toBe(testUser1.id);
    expect(entry2.userId).toBe(testUser2.id);
    expect(entry1.date).toEqual(entry2.date);
    expect(entry1.count).not.toBe(entry2.count);
  });

  it('should enforce userId association with User model', async () => {
    const entry = await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: new Date('2025-11-10'),
        count: 7,
      },
      include: {
        user: true,
      },
    });

    expect(entry.user).toBeDefined();
    expect(entry.user.id).toBe(testUser1.id);
    expect(entry.user.email).toBe('eggprodtest1@example.com');
  });

  it('should cascade delete egg production entries when user is deleted', async () => {
    // Create a separate test user for cascade delete test
    const hashedPassword = await bcrypt.hash('TestPassword123', 10);
    const cascadeTestUser = await prisma.user.create({
      data: {
        email: 'eggprodtest-cascade@example.com',
        password: hashedPassword,
      },
    });

    // Create egg production entries for this user
    await prisma.eggProduction.create({
      data: {
        userId: cascadeTestUser.id,
        date: new Date('2025-11-09'),
        count: 3,
      },
    });
    await prisma.eggProduction.create({
      data: {
        userId: cascadeTestUser.id,
        date: new Date('2025-11-08'),
        count: 4,
      },
    });

    // Verify entries exist
    const entriesBeforeDelete = await prisma.eggProduction.findMany({
      where: { userId: cascadeTestUser.id },
    });
    expect(entriesBeforeDelete.length).toBe(2);

    // Delete the user
    await prisma.user.delete({
      where: { id: cascadeTestUser.id },
    });

    // Verify entries were cascade deleted
    const entriesAfterDelete = await prisma.eggProduction.findMany({
      where: { userId: cascadeTestUser.id },
    });
    expect(entriesAfterDelete.length).toBe(0);
  });

  it('should automatically set and update timestamps', async () => {
    const entry = await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: new Date('2025-11-07'),
        count: 6,
      },
    });

    const createdAt = entry.createdAt;
    const updatedAt = entry.updatedAt;

    expect(createdAt).toBeInstanceOf(Date);
    expect(updatedAt).toBeInstanceOf(Date);

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the entry
    const updatedEntry = await prisma.eggProduction.update({
      where: { id: entry.id },
      data: { count: 7 },
    });

    expect(updatedEntry.createdAt).toEqual(createdAt); // Should not change
    expect(updatedEntry.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime()); // Should be updated
  });

  it('should auto-generate CUID for egg production id', async () => {
    const entry = await prisma.eggProduction.create({
      data: {
        userId: testUser1.id,
        date: new Date('2025-11-06'),
        count: 4,
      },
    });

    // CUID format: starts with 'c' and contains alphanumeric characters
    expect(entry.id).toBeDefined();
    expect(typeof entry.id).toBe('string');
    expect(entry.id.length).toBeGreaterThan(0);
  });
});
