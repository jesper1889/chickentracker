/**
 * ChickenCard Component
 *
 * Displays a chicken profile in a card format with photo, details, and action buttons.
 * Used in the chicken list page to show individual chicken information.
 *
 * Features:
 * - Shows chicken photo or placeholder icon
 * - Displays name, breed, sex, and calculated age
 * - Provides Edit, Delete, and Mark as Deceased action buttons
 * - Responsive and touch-friendly design
 * - Amber/orange color scheme
 */

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chicken } from '@/lib/types/chicken';
import { Pencil, Trash2, Skull } from 'lucide-react';

interface ChickenCardProps {
  chicken: Chicken;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkDeceased?: (chicken: Chicken) => void;
}

/**
 * Calculate age from birth date to today or death date
 */
function calculateAge(birthDate: Date | null, deathDate: Date | null): string {
  if (!birthDate) return 'Age unknown';

  const endDate = deathDate ? new Date(deathDate) : new Date();
  const startDate = new Date(birthDate);

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} old`;
  } else if (diffDays < 365) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} old`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''} old`;
    }
    return `${years}y ${remainingMonths}m old`;
  }
}

/**
 * Get human-readable sex label
 */
function getSexLabel(sex: string | null): string {
  if (!sex) return '';
  return sex.charAt(0) + sex.slice(1).toLowerCase();
}

export default function ChickenCard({
  chicken,
  onEdit,
  onDelete,
  onMarkDeceased,
}: ChickenCardProps) {
  const isDeceased = !!chicken.deathDate;
  const age = calculateAge(chicken.birthDate, chicken.deathDate);
  const sexLabel = getSexLabel(chicken.sex);

  // Photo URL or placeholder
  const photoUrl = chicken.photoMimeType
    ? `/api/chickens/${chicken.id}/photo`
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* Photo section */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-amber-50 to-orange-50">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={chicken.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-24 h-24 text-amber-300"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C10.34 2 9 3.34 9 5c0 1.38.91 2.54 2.16 2.9-.08.33-.16.66-.16 1.1 0 2.5 1.79 4.58 4.16 5.07C15.5 15.16 16 16.5 16 18v4h2v-4c0-2.5-1.79-4.58-4.16-5.07C13.5 11.84 13 10.5 13 9c0-.44.08-.77.16-1.1C14.41 7.54 15 6.38 15 5c0-1.66-1.34-3-3-3zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Details section */}
        <div className="p-4 space-y-3">
          {/* Name */}
          <h3 className="text-lg font-semibold text-amber-900 truncate">
            {chicken.name}
          </h3>

          {/* Breed and Sex */}
          <div className="flex flex-wrap gap-2 text-sm text-amber-700">
            {chicken.breed && (
              <span className="px-2 py-1 bg-amber-50 rounded-md border border-amber-200">
                {chicken.breed}
              </span>
            )}
            {sexLabel && (
              <span className="px-2 py-1 bg-orange-50 rounded-md border border-orange-200">
                {sexLabel}
              </span>
            )}
          </div>

          {/* Age */}
          <p className="text-sm text-gray-600">{age}</p>

          {/* Death date badge if deceased */}
          {isDeceased && chicken.deathDate && (
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-700">
              <Skull className="w-4 h-4" />
              <span>
                Deceased:{' '}
                {new Date(chicken.deathDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                onClick={() => onEdit(chicken.id)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onDelete(chicken.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>

          {/* Mark as Deceased button - only for active chickens */}
          {!isDeceased && onMarkDeceased && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-600 hover:bg-gray-100"
              onClick={() => onMarkDeceased(chicken)}
            >
              <Skull className="w-4 h-4 mr-2" />
              Mark as Deceased
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
