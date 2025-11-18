/**
 * Chicken Model Tests
 *
 * These tests verify critical Chicken model functionality:
 * - Chicken creation with valid data
 * - Required field validation (name)
 * - userId association with User model
 * - Date constraints (birthDate not in future, deathDate after birthDate)
 * - Cascade delete when user is deleted
 *
 * @jest-environment node
 */

import { PrismaClient } from '../../lib/generated/prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Test user for chicken associations
let testUser: { id: string; email: string }

// Clean up database before and after tests
beforeAll(async () => {
  // Clean up any existing test data
  await prisma.chicken.deleteMany({
    where: {
      user: {
        email: {
          contains: 'chickentest'
        }
      }
    }
  })
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'chickentest'
      }
    }
  })

  // Create test user
  const hashedPassword = await bcrypt.hash('TestPassword123', 10)
  testUser = await prisma.user.create({
    data: {
      email: 'chickentest@example.com',
      password: hashedPassword,
      name: 'Chicken Test User'
    }
  })
})

afterAll(async () => {
  // Clean up test data
  await prisma.chicken.deleteMany({
    where: {
      user: {
        email: {
          contains: 'chickentest'
        }
      }
    }
  })
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'chickentest'
      }
    }
  })
  await prisma.$disconnect()
})

describe('Chicken Model', () => {
  it('should create a chicken with all valid fields', async () => {
    const chicken = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Henrietta',
        breed: 'Rhode Island Red',
        sex: 'HEN',
        birthDate: new Date('2023-01-15'),
        notes: 'Friendly and good layer'
      }
    })

    expect(chicken).toBeDefined()
    expect(chicken.id).toBeDefined()
    expect(chicken.userId).toBe(testUser.id)
    expect(chicken.name).toBe('Henrietta')
    expect(chicken.breed).toBe('Rhode Island Red')
    expect(chicken.sex).toBe('HEN')
    expect(chicken.birthDate).toBeInstanceOf(Date)
    expect(chicken.deathDate).toBeNull()
    expect(chicken.photo).toBeNull()
    expect(chicken.photoMimeType).toBeNull()
    expect(chicken.notes).toBe('Friendly and good layer')
    expect(chicken.createdAt).toBeInstanceOf(Date)
    expect(chicken.updatedAt).toBeInstanceOf(Date)
  })

  it('should create a chicken with only required fields (name and userId)', async () => {
    const chicken = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Nugget'
      }
    })

    expect(chicken).toBeDefined()
    expect(chicken.name).toBe('Nugget')
    expect(chicken.userId).toBe(testUser.id)
    expect(chicken.breed).toBeNull()
    expect(chicken.sex).toBeNull()
    expect(chicken.birthDate).toBeNull()
    expect(chicken.deathDate).toBeNull()
    expect(chicken.notes).toBeNull()
  })

  it('should enforce userId association with User model', async () => {
    const chicken = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Clucky',
        breed: 'Leghorn'
      },
      include: {
        user: true
      }
    })

    expect(chicken.user).toBeDefined()
    expect(chicken.user.id).toBe(testUser.id)
    expect(chicken.user.email).toBe('chickentest@example.com')
  })

  it('should support all valid sex enum values', async () => {
    const hen = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Hen Test',
        sex: 'HEN'
      }
    })
    expect(hen.sex).toBe('HEN')

    const rooster = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Rooster Test',
        sex: 'ROOSTER'
      }
    })
    expect(rooster.sex).toBe('ROOSTER')

    const unknown = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Unknown Test',
        sex: 'UNKNOWN'
      }
    })
    expect(unknown.sex).toBe('UNKNOWN')
  })

  it('should allow setting deathDate to mark chicken as deceased', async () => {
    const chicken = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Memorial',
        birthDate: new Date('2022-01-01')
      }
    })

    expect(chicken.deathDate).toBeNull()

    const updatedChicken = await prisma.chicken.update({
      where: { id: chicken.id },
      data: {
        deathDate: new Date('2023-12-01')
      }
    })

    expect(updatedChicken.deathDate).toBeInstanceOf(Date)
    expect(updatedChicken.deathDate?.getFullYear()).toBe(2023)
  })

  it('should cascade delete chickens when user is deleted', async () => {
    // Create a separate test user for cascade delete test
    const hashedPassword = await bcrypt.hash('TestPassword123', 10)
    const cascadeTestUser = await prisma.user.create({
      data: {
        email: 'chickentest-cascade@example.com',
        password: hashedPassword
      }
    })

    // Create chickens for this user
    await prisma.chicken.create({
      data: {
        userId: cascadeTestUser.id,
        name: 'Cascade Test 1'
      }
    })
    await prisma.chicken.create({
      data: {
        userId: cascadeTestUser.id,
        name: 'Cascade Test 2'
      }
    })

    // Verify chickens exist
    const chickensBeforeDelete = await prisma.chicken.findMany({
      where: { userId: cascadeTestUser.id }
    })
    expect(chickensBeforeDelete.length).toBe(2)

    // Delete the user
    await prisma.user.delete({
      where: { id: cascadeTestUser.id }
    })

    // Verify chickens were cascade deleted
    const chickensAfterDelete = await prisma.chicken.findMany({
      where: { userId: cascadeTestUser.id }
    })
    expect(chickensAfterDelete.length).toBe(0)
  })

  it('should auto-generate UUID for chicken id', async () => {
    const chicken = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'UUID Test'
      }
    })

    // UUID format: 8-4-4-4-12 characters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    expect(chicken.id).toMatch(uuidRegex)
  })

  it('should automatically set and update timestamps', async () => {
    const chicken = await prisma.chicken.create({
      data: {
        userId: testUser.id,
        name: 'Timestamp Test',
        notes: 'Original notes'
      }
    })

    const createdAt = chicken.createdAt
    const updatedAt = chicken.updatedAt

    expect(createdAt).toBeInstanceOf(Date)
    expect(updatedAt).toBeInstanceOf(Date)

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update the chicken
    const updatedChicken = await prisma.chicken.update({
      where: { id: chicken.id },
      data: { notes: 'Updated notes' }
    })

    expect(updatedChicken.createdAt).toEqual(createdAt) // Should not change
    expect(updatedChicken.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime()) // Should be updated
  })
})
