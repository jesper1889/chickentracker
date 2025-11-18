/**
 * Edit Chicken Page (Server Component)
 *
 * Protected page for editing an existing chicken profile.
 * Fetches chicken data server-side and passes to client component.
 *
 * Features:
 * - Server-side authentication and authorization
 * - Fetches chicken by ID
 * - Returns 404 if chicken not found or unauthorized
 * - Passes data to client edit form
 */

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';
import EditChickenForm from '@/components/edit-chicken-form';
import { Chicken } from '@/lib/types/chicken';

const prisma = new PrismaClient();

interface EditChickenPageProps {
  params: {
    id: string;
  };
}

export default async function EditChickenPage({
  params,
}: EditChickenPageProps) {
  // Check authentication
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch chicken by ID
  const chickenData = await prisma.chicken.findUnique({
    where: {
      id: params.id,
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

  // Return 404 if chicken not found
  if (!chickenData) {
    notFound();
  }

  // Check authorization - user can only edit their own chickens
  if (chickenData.userId !== session.user.id) {
    notFound(); // Return 404 instead of 403 to prevent user enumeration
  }

  // Serialize chicken for client component
  const chicken: Chicken = {
    id: chickenData.id,
    userId: chickenData.userId,
    name: chickenData.name,
    breed: chickenData.breed,
    sex: chickenData.sex,
    birthDate: chickenData.birthDate,
    deathDate: chickenData.deathDate,
    photoMimeType: chickenData.photoMimeType,
    notes: chickenData.notes,
    createdAt: chickenData.createdAt,
    updatedAt: chickenData.updatedAt,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <EditChickenForm chicken={chicken} />
      </div>
    </div>
  );
}
