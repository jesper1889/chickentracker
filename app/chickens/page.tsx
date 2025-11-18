/**
 * Chickens List Page (Server Component)
 *
 * Protected page that displays all chickens for the authenticated user.
 * Fetches initial data server-side and passes to client component for interactivity.
 *
 * Features:
 * - Server-side authentication check
 * - Fetches chickens from database
 * - Serializes dates for client component
 * - Redirects to login if not authenticated
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';
import ChickenListClient from '@/components/chicken-list-client';
import { Chicken } from '@/lib/types/chicken';

const prisma = new PrismaClient();

export default async function ChickensPage() {
  // Check authentication
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch chickens for the authenticated user
  const chickensData = await prisma.chicken.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      userId: true,
      name: true,
      breed: true,
      sex: true,
      birthDate: true,
      deathDate: true,
      photoMimeType: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Serialize chickens for client component (convert Dates to Date objects)
  const chickens: Chicken[] = chickensData.map((chicken) => ({
    id: chicken.id,
    userId: chicken.userId,
    name: chicken.name,
    breed: chicken.breed,
    sex: chicken.sex,
    birthDate: chicken.birthDate,
    deathDate: chicken.deathDate,
    photoMimeType: chicken.photoMimeType,
    notes: chicken.notes,
    createdAt: chicken.createdAt,
    updatedAt: chicken.updatedAt,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <ChickenListClient initialChickens={chickens} />
      </div>
    </div>
  );
}
