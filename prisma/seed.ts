import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed database with two user accounts.
 * This script is idempotent and can be run multiple times safely.
 *
 * To run this script: npx prisma db seed
 *
 * To update passwords:
 * 1. Generate a new hash: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash));"
 * 2. Update the password field directly in the database, or modify the hashed passwords in this script and re-run seed
 *
 * To update emails:
 * Modify the email values below and re-run the seed script. Existing users will be updated via upsert.
 */
async function main() {
  const users = [
    {
      email: 'user1@example.com',
      name: 'User One',
      password: 'password123', // Plain text - will be hashed below
    },
    {
      email: 'user2@example.com',
      name: 'User Two',
      password: 'password456', // Plain text - will be hashed below
    },
  ];

  for (const userData of users) {
    // Hash password with 10 salt rounds (minimum required)
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Use upsert to create or update user - ensures idempotency
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        password: hashedPassword,
      },
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      },
    });

    console.log(`Upserted user: ${user.email} (ID: ${user.id})`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
