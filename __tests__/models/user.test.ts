/**
 * User Model Tests
 *
 * These tests verify critical User model functionality:
 * - User creation with required fields
 * - Email uniqueness constraint
 * - Password hashing integration
 * - Timestamp auto-generation
 *
 * @jest-environment node
 */

import { PrismaClient } from '../../lib/generated/prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Clean up database before and after tests
beforeAll(async () => {
  // Delete all test users before running tests
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test'
      }
    }
  })
})

afterAll(async () => {
  // Clean up test data
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test'
      }
    }
  })
  await prisma.$disconnect()
})

describe('User Model', () => {
  it('should create a user with required fields', async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123', 10)

    const user = await prisma.user.create({
      data: {
        email: 'test1@example.com',
        password: hashedPassword,
        name: 'Test User'
      }
    })

    expect(user).toBeDefined()
    expect(user.id).toBeDefined()
    expect(user.email).toBe('test1@example.com')
    expect(user.name).toBe('Test User')
    expect(user.password).not.toBe('TestPassword123') // Should be hashed
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
  })

  it('should enforce email uniqueness constraint', async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123', 10)

    // Create first user
    await prisma.user.create({
      data: {
        email: 'test-unique@example.com',
        password: hashedPassword
      }
    })

    // Attempt to create second user with same email
    await expect(
      prisma.user.create({
        data: {
          email: 'test-unique@example.com',
          password: hashedPassword
        }
      })
    ).rejects.toThrow()
  })

  it('should allow creating a user without optional name field', async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123', 10)

    const user = await prisma.user.create({
      data: {
        email: 'test-no-name@example.com',
        password: hashedPassword
      }
    })

    expect(user).toBeDefined()
    expect(user.name).toBeNull()
    expect(user.email).toBe('test-no-name@example.com')
  })

  it('should verify bcrypt password hashing works correctly', async () => {
    const plainPassword = 'SecurePassword456'
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    const user = await prisma.user.create({
      data: {
        email: 'test-bcrypt@example.com',
        password: hashedPassword
      }
    })

    // Verify password is hashed
    expect(user.password).not.toBe(plainPassword)

    // Verify bcrypt.compare works
    const isMatch = await bcrypt.compare(plainPassword, user.password)
    expect(isMatch).toBe(true)

    // Verify wrong password doesn't match
    const isWrongMatch = await bcrypt.compare('WrongPassword', user.password)
    expect(isWrongMatch).toBe(false)
  })

  it('should auto-generate UUID for user id', async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123', 10)

    const user = await prisma.user.create({
      data: {
        email: 'test-uuid@example.com',
        password: hashedPassword
      }
    })

    // UUID format: 8-4-4-4-12 characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    expect(user.id).toMatch(uuidRegex)
  })

  it('should automatically set and update timestamps', async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123', 10)

    const user = await prisma.user.create({
      data: {
        email: 'test-timestamps@example.com',
        password: hashedPassword,
        name: 'Original Name'
      }
    })

    const createdAt = user.createdAt
    const updatedAt = user.updatedAt

    expect(createdAt).toBeInstanceOf(Date)
    expect(updatedAt).toBeInstanceOf(Date)

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Name' }
    })

    expect(updatedUser.createdAt).toEqual(createdAt) // Should not change
    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime()) // Should be updated
  })
})
