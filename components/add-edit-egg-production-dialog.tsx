/**
 * AddEditEggProductionDialog Component
 *
 * Dialog for adding or editing daily egg production entries.
 * Includes date picker and count input with validation.
 *
 * Features:
 * - Pre-filled date (from calendar click or current date)
 * - Pre-filled count (if editing existing entry)
 * - Client-side validation using shared eggProductionSchema
 * - Loading state during submission
 * - Success confirmation message
 * - Error handling with retry option
 * - Support for "0 eggs" entries
 * - User-friendly error messages
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EggProduction } from '@/lib/types/egg-production';
import { eggProductionSchema, EggProductionFormData } from '@/lib/validations/egg-production';

/**
 * Client-side form schema using shared server-side validation schema
 * This ensures validation parity between client and server
 */
const clientFormSchema = eggProductionSchema;

interface AddEditEggProductionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  entryToEdit?: EggProduction | null;
  onSuccess: () => void;
}

/**
 * Formats a user-friendly error message for display
 * Handles common validation error cases with actionable messages
 */
function formatErrorMessage(error: string): string {
  // Map server-side validation errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Date cannot be in the future': 'You cannot log eggs for a future date. Please select today or an earlier date.',
    'Count must be a whole number': 'Egg count must be a whole number (no decimals).',
    'Count cannot be negative': 'Egg count cannot be negative. It must be 0 or greater.',
    'You can only have one entry per day': 'You already have an entry for this date. Please edit the existing entry instead.',
  };

  // Check if error matches a known pattern
  for (const [key, message] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return message;
    }
  }

  // Fallback to original error if no mapping found
  return error;
}

export default function AddEditEggProductionDialog({
  isOpen,
  onClose,
  selectedDate,
  entryToEdit,
  onSuccess,
}: AddEditEggProductionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Determine the date to use (either selected date or existing entry date)
  const dateToUse = entryToEdit
    ? new Date(entryToEdit.date)
    : selectedDate || new Date();
  const dateString = dateToUse.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EggProductionFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      date: dateToUse,
      count: entryToEdit?.count || 0,
    },
  });

  // Watch the count field for display purposes
  const countValue = watch('count');
  const dateValue = watch('date');

  /**
   * Handle form submission
   * Sends validated data to API and handles responses
   */
  const onSubmit = async (data: EggProductionFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = entryToEdit ? `/api/egg-production/${entryToEdit.id}` : '/api/egg-production';
      const method = entryToEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: data.date.toISOString(),
          count: data.count,
        }),
      });

      // Handle API response
      if (!response.ok) {
        const errorData = await response.json();

        // Extract the most relevant error message
        let errorMessage = 'Failed to save entry. Please try again.';
        if (errorData.details && Array.isArray(errorData.details)) {
          // Get the first field error's message
          const fieldError = errorData.details[0];
          if (fieldError && fieldError.message) {
            errorMessage = formatErrorMessage(fieldError.message);
          }
        } else if (errorData.error) {
          errorMessage = formatErrorMessage(errorData.error);
        }

        throw new Error(errorMessage);
      }

      setSuccess(true);
      reset();

      // Close dialog after brief success message
      setTimeout(() => {
        onClose();
        onSuccess();
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save entry. Please try again.';
      setError(message);
      setIsLoading(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isLoading) {
      reset();
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-900">
            {entryToEdit ? 'Edit Egg Production' : 'Add Egg Production Entry'}
          </DialogTitle>
          <DialogDescription className="text-amber-700">
            Record your daily egg count for{' '}
            {dateValue instanceof Date
              ? dateValue.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })
              : new Date(dateString).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Date field */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                aria-invalid={errors.date ? 'true' : 'false'}
                aria-describedby={errors.date ? 'date-error' : undefined}
                className="h-11"
                {...register('date', {
                  setValueAs: (value) => {
                    if (typeof value === 'string') {
                      return new Date(value);
                    }
                    return value;
                  },
                })}
              />
              {errors.date && (
                <p id="date-error" className="text-sm text-red-600" role="alert">
                  {typeof errors.date.message === 'string'
                    ? formatErrorMessage(errors.date.message)
                    : 'Invalid date'}
                </p>
              )}
            </div>

            {/* Count field */}
            <div className="space-y-2">
              <Label htmlFor="count" className="text-sm font-medium">
                Number of Eggs
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="count"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="0"
                  aria-invalid={errors.count ? 'true' : 'false'}
                  aria-describedby={errors.count ? 'count-error' : undefined}
                  className="h-11"
                  {...register('count', { valueAsNumber: true })}
                />
              </div>
              {errors.count && (
                <p id="count-error" className="text-sm text-red-600" role="alert">
                  {typeof errors.count.message === 'string'
                    ? formatErrorMessage(errors.count.message)
                    : 'Invalid count'}
                </p>
              )}
              <p className="text-xs text-gray-600">
                {countValue === 0
                  ? 'You can log 0 eggs to indicate no production that day'
                  : countValue === 1
                    ? '1 egg'
                    : `${countValue} eggs`}
              </p>
            </div>

            {/* Success message */}
            {success && (
              <div
                className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200"
                role="status"
                aria-live="polite"
              >
                Entry saved successfully!
              </div>
            )}

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
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || success}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading
                ? 'Saving...'
                : success
                  ? 'Saved!'
                  : entryToEdit
                    ? 'Update Entry'
                    : 'Add Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
