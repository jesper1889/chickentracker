/**
 * PhotoUpload Component
 *
 * File input component for uploading, replacing, and removing chicken photos.
 * Provides client-side validation for file type and size.
 *
 * Features:
 * - Photo preview for current and new photos
 * - Client-side file validation (JPEG/PNG/GIF, max 5MB)
 * - Upload, Replace, and Remove actions
 * - Inline error messages
 * - Accessible file input
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoChange: (file: File | null) => void;
  onPhotoRemove?: () => void;
  error?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function PhotoUpload({
  currentPhotoUrl,
  onPhotoChange,
  onPhotoRemove,
  error,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  /**
   * Validate and handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPreview(null);
      onPhotoChange(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError(
        'Invalid file type. Please upload a JPEG, PNG, or GIF image.'
      );
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setValidationError(
        'File is too large. Maximum size is 5MB. Please compress your image and try again.'
      );
      e.target.value = '';
      return;
    }

    // Clear validation error and set preview
    setValidationError('');

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call parent handler
    onPhotoChange(file);
  };

  /**
   * Handle photo removal
   */
  const handleRemove = () => {
    setPreview(null);
    setValidationError('');
    onPhotoChange(null);
    if (onPhotoRemove) {
      onPhotoRemove();
    }
  };

  const hasPhoto = preview || currentPhotoUrl;
  const displayUrl = preview || currentPhotoUrl;

  return (
    <div className="space-y-4">
      <Label htmlFor="photo">Photo (optional)</Label>

      {/* Photo preview */}
      {hasPhoto && displayUrl && (
        <div className="relative w-full max-w-xs aspect-square bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg overflow-hidden border-2 border-amber-200">
          <Image
            src={displayUrl}
            alt="Chicken photo preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 384px"
          />

          {/* Remove button */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            aria-label="Remove photo"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* File input - hidden */}
      <input
        type="file"
        id="photo"
        name="photo"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
        className="sr-only"
        aria-describedby={
          validationError || error ? 'photo-error' : undefined
        }
        aria-invalid={!!(validationError || error)}
      />

      {/* Upload/Replace button */}
      <div>
        <Label htmlFor="photo" asChild>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer border-amber-300 text-amber-700 hover:bg-amber-50"
            asChild
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {hasPhoto ? 'Replace Photo' : 'Upload Photo'}
            </span>
          </Button>
        </Label>
      </div>

      {/* Helper text */}
      <p className="text-sm text-gray-500">
        Accepted formats: JPEG, PNG, GIF. Maximum size: 5MB.
      </p>

      {/* Validation error */}
      {(validationError || error) && (
        <p id="photo-error" className="text-sm text-red-600" role="alert">
          {validationError || error}
        </p>
      )}
    </div>
  );
}
