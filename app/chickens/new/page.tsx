/**
 * Add Chicken Page
 *
 * Client-side form for creating a new chicken profile.
 * Uses React Hook Form with Zod validation for form handling.
 *
 * Features:
 * - Form validation with inline error messages
 * - Photo upload with preview
 * - Date picker for birth date
 * - Dropdown for sex selection
 * - Loading state during submission
 * - Navigation back to list on success or cancel
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PhotoUpload from '@/components/photo-upload';
import { Sex } from '@/lib/types/chicken';

// Client-side validation schema (matches server-side but for strings)
const chickenFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  breed: z.string().max(100, 'Breed must be 100 characters or less').optional(),
  sex: z.enum(['HEN', 'ROOSTER', 'UNKNOWN']).optional(),
  birthDate: z.string().optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
});

type ChickenFormValues = z.infer<typeof chickenFormSchema>;

export default function NewChickenPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ChickenFormValues>({
    resolver: zodResolver(chickenFormSchema),
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ChickenFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('name', data.name);

      if (data.breed) formData.append('breed', data.breed);
      if (data.sex) formData.append('sex', data.sex);
      if (data.birthDate) formData.append('birthDate', data.birthDate);
      if (data.notes) formData.append('notes', data.notes);
      if (photoFile) formData.append('photo', photoFile);

      const response = await fetch('/api/chickens', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chicken');
      }

      // Success - navigate to list
      router.push('/chickens');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chicken');
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.push('/chickens');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-amber-900">
              Add New Chicken
            </CardTitle>
            <CardDescription className="text-amber-700">
              Create a profile for a new member of your flock
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Henrietta"
                  className="h-11"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  {...register('name')}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-red-600" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Breed field */}
              <div className="space-y-2">
                <Label htmlFor="breed" className="text-sm font-medium text-gray-700">
                  Breed (optional)
                </Label>
                <Input
                  id="breed"
                  type="text"
                  placeholder="e.g., Rhode Island Red"
                  className="h-11"
                  aria-invalid={errors.breed ? 'true' : 'false'}
                  aria-describedby={errors.breed ? 'breed-error' : undefined}
                  {...register('breed')}
                />
                {errors.breed && (
                  <p id="breed-error" className="text-sm text-red-600" role="alert">
                    {errors.breed.message}
                  </p>
                )}
              </div>

              {/* Sex field */}
              <div className="space-y-2">
                <Label htmlFor="sex" className="text-sm font-medium text-gray-700">
                  Sex (optional)
                </Label>
                <Controller
                  name="sex"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HEN">Hen</SelectItem>
                        <SelectItem value="ROOSTER">Rooster</SelectItem>
                        <SelectItem value="UNKNOWN">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Birth date field */}
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
                  Birth Date (optional)
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  className="h-11"
                  max={new Date().toISOString().split('T')[0]}
                  aria-invalid={errors.birthDate ? 'true' : 'false'}
                  aria-describedby={errors.birthDate ? 'birthDate-error' : undefined}
                  {...register('birthDate')}
                />
                {errors.birthDate && (
                  <p id="birthDate-error" className="text-sm text-red-600" role="alert">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>

              {/* Photo upload */}
              <PhotoUpload
                onPhotoChange={setPhotoFile}
                currentPhotoUrl={null}
              />

              {/* Notes field */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this chicken..."
                  rows={4}
                  className="resize-none"
                  aria-invalid={errors.notes ? 'true' : 'false'}
                  aria-describedby={errors.notes ? 'notes-error' : undefined}
                  {...register('notes')}
                />
                {errors.notes && (
                  <p id="notes-error" className="text-sm text-red-600" role="alert">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isLoading ? 'Creating...' : 'Create Chicken'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
