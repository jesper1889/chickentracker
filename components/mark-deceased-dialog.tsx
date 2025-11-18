/**
 * MarkDeceasedDialog Component
 *
 * Dialog component for marking a chicken as deceased with a date selection.
 * Validates the death date and calls the API to update the chicken record.
 *
 * Features:
 * - Date picker defaulting to today
 * - Validation: death date not in future, not before birth date
 * - Loading state during API call
 * - Error handling with user-friendly messages
 * - Cancel and Confirm actions
 */

'use client';

import { useState } from 'react';
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
import { Chicken } from '@/lib/types/chicken';

interface MarkDeceasedDialogProps {
  chicken: Chicken | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (chickenId: string, deathDate: Date) => Promise<void>;
}

export default function MarkDeceasedDialog({
  chicken,
  open,
  onOpenChange,
  onConfirm,
}: MarkDeceasedDialogProps) {
  const [deathDate, setDeathDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!chicken) return null;

  /**
   * Validate death date
   */
  const validateDeathDate = (dateStr: string): string | null => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Check if date is in the future
    if (date > today) {
      return 'Death date cannot be in the future';
    }

    // Check if date is before birth date
    if (chicken.birthDate) {
      const birthDate = new Date(chicken.birthDate);
      birthDate.setHours(0, 0, 0, 0); // Start of birth day

      if (date < birthDate) {
        return 'Death date cannot be before birth date';
      }
    }

    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateDeathDate(deathDate);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await onConfirm(chicken.id, new Date(deathDate));
      onOpenChange(false);
      // Reset form
      setDeathDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to mark chicken as deceased'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isLoading) {
      setError('');
      setDeathDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-900">
            Mark {chicken.name} as Deceased
          </DialogTitle>
          <DialogDescription className="text-amber-700">
            Select the date when {chicken.name} passed away. This action cannot
            be easily undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Death date input */}
            <div className="space-y-2">
              <Label htmlFor="deathDate" className="text-sm font-medium">
                Death Date
              </Label>
              <Input
                id="deathDate"
                type="date"
                value={deathDate}
                onChange={(e) => {
                  setDeathDate(e.target.value);
                  setError(''); // Clear error on change
                }}
                max={new Date().toISOString().split('T')[0]}
                min={
                  chicken.birthDate
                    ? new Date(chicken.birthDate).toISOString().split('T')[0]
                    : undefined
                }
                required
                aria-invalid={!!error}
                aria-describedby={error ? 'date-error' : undefined}
                className="h-11"
              />
            </div>

            {/* Error message */}
            {error && (
              <p id="date-error" className="text-sm text-red-600" role="alert">
                {error}
              </p>
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
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? 'Marking as Deceased...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
