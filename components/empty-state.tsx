/**
 * EmptyState Component
 *
 * Displays a friendly message when no data is available with an optional call-to-action button.
 * Used throughout the app to indicate empty states (e.g., no chickens added yet).
 *
 * Features:
 * - Centered layout with icon
 * - Customizable title, description, and action button
 * - Consistent amber/orange color scheme
 * - Responsive design
 */

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="mb-4">
        {icon || (
          <svg
            className="w-16 h-16 text-amber-300"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C10.34 2 9 3.34 9 5c0 1.38.91 2.54 2.16 2.9-.08.33-.16.66-.16 1.1 0 2.5 1.79 4.58 4.16 5.07C15.5 15.16 16 16.5 16 18v4h2v-4c0-2.5-1.79-4.58-4.16-5.07C13.5 11.84 13 10.5 13 9c0-.44.08-.77.16-1.1C14.41 7.54 15 6.38 15 5c0-1.66-1.34-3-3-3zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
          </svg>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-amber-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-amber-700 max-w-md mb-6">{description}</p>

      {/* Action button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
