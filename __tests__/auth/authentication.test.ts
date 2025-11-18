import 'dotenv/config';
import { PrismaClient } from '../../lib/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Authentication Flow', () => {
  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: { password: hashedPassword },
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      },
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.delete({
      where: { email: 'test@example.com' },
    }).catch(() => {
      // Ignore if already deleted
    });
    await prisma.$disconnect();
  });

  test('should find user by email and verify correct password', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe('test@example.com');

    const isValidPassword = await bcrypt.compare('testpass123', user!.password);
    expect(isValidPassword).toBe(true);
  });

  test('should reject invalid password', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    expect(user).not.toBeNull();

    const isValidPassword = await bcrypt.compare('wrongpassword', user!.password);
    expect(isValidPassword).toBe(false);
  });

  test('should return null for non-existent user', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'nonexistent@example.com' },
    });

    expect(user).toBeNull();
  });

  test('should include user ID and email in user object', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    expect(user).not.toBeNull();
    expect(user?.id).toBeDefined();
    expect(typeof user?.id).toBe('string');
    expect(user?.email).toBe('test@example.com');
    expect(user?.name).toBe('Test User');
  });

  test('should hash passwords with bcrypt', async () => {
    const plainPassword = 'newpassword123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Hash should be different from plain text
    expect(hashedPassword).not.toBe(plainPassword);

    // Should start with bcrypt prefix
    expect(hashedPassword).toMatch(/^\$2[ayb]\$.{56}$/);

    // Should verify correctly
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    expect(isValid).toBe(true);
  });
});
