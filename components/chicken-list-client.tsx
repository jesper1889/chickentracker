/**
 * ChickenListClient Component
 *
 * Client-side interactive component for displaying and managing chickens.
 * Provides tabbed interface for active vs deceased chickens with CRUD operations.
 *
 * Features:
 * - Tabbed interface (Active/Deceased)
 * - Responsive grid layout (1/2/3 columns)
 * - Add, Edit, Delete, and Mark as Deceased actions
 * - Empty states for each tab
 * - Optimistic UI updates
 * - Error handling with user feedback
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ChickenCard from '@/components/chicken-card';
import EmptyState from '@/components/empty-state';
import MarkDeceasedDialog from '@/components/mark-deceased-dialog';
import { Chicken } from '@/lib/types/chicken';
import { Plus } from 'lucide-react';

interface ChickenListClientProps {
  initialChickens: Chicken[];
}

export default function ChickenListClient({
  initialChickens,
}: ChickenListClientProps) {
  const router = useRouter();
  const [chickens, setChickens] = useState<Chicken[]>(initialChickens);
  const [selectedChicken, setSelectedChicken] = useState<Chicken | null>(null);
  const [isDeceasedDialogOpen, setIsDeceasedDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter chickens by status
  const activeChickens = chickens.filter((c) => !c.deathDate);
  const deceasedChickens = chickens.filter((c) => c.deathDate);

  /**
   * Navigate to add chicken page
   */
  const handleAddChicken = () => {
    router.push('/chickens/new');
  };

  /**
   * Navigate to edit chicken page
   */
  const handleEdit = (id: string) => {
    router.push(`/chickens/${id}/edit`);
  };

  /**
   * Delete chicken with confirmation
   */
  const handleDelete = async (id: string) => {
    const chicken = chickens.find((c) => c.id === id);
    if (!chicken) return;

    if (
      !confirm(
        `Are you sure you want to delete ${chicken.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/chickens/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete chicken');
      }

      // Optimistically update UI
      setChickens((prev) => prev.filter((c) => c.id !== id));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete chicken'
      );
      console.error('Delete error:', err);
    }
  };

  /**
   * Open mark deceased dialog
   */
  const handleMarkDeceased = (chicken: Chicken) => {
    setSelectedChicken(chicken);
    setIsDeceasedDialogOpen(true);
  };

  /**
   * Confirm mark deceased action
   */
  const handleConfirmDeceased = async (
    chickenId: string,
    deathDate: Date
  ) => {
    try {
      const response = await fetch(`/api/chickens/${chickenId}/mark-deceased`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deathDate: deathDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark chicken as deceased');
      }

      const updatedChicken = await response.json();

      // Update chickens list with the updated chicken
      setChickens((prev) =>
        prev.map((c) =>
          c.id === chickenId
            ? { ...c, deathDate: new Date(updatedChicken.deathDate) }
            : c
        )
      );

      setError(null);
    } catch (err) {
      throw err; // Re-throw to be handled by dialog
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">My Chickens</h1>
        <Button
          onClick={handleAddChicken}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Chicken
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-amber-100">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-white data-[state=active]:text-amber-900"
          >
            Active ({activeChickens.length})
          </TabsTrigger>
          <TabsTrigger
            value="deceased"
            className="data-[state=active]:bg-white data-[state=active]:text-amber-900"
          >
            Deceased ({deceasedChickens.length})
          </TabsTrigger>
        </TabsList>

        {/* Active chickens tab */}
        <TabsContent value="active" className="mt-6">
          {activeChickens.length === 0 ? (
            <EmptyState
              title="No Active Chickens"
              description="You haven't added any chickens yet. Add your first chicken to start tracking your flock."
              actionLabel="Add Your First Chicken"
              onAction={handleAddChicken}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChickens.map((chicken) => (
                <ChickenCard
                  key={chicken.id}
                  chicken={chicken}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMarkDeceased={handleMarkDeceased}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Deceased chickens tab */}
        <TabsContent value="deceased" className="mt-6">
          {deceasedChickens.length === 0 ? (
            <EmptyState
              title="No Deceased Chickens"
              description="No chickens have been marked as deceased yet."
              actionLabel="View Active Chickens"
              onAction={() => {
                // Switch to active tab
                const activeTab = document.querySelector(
                  '[value="active"]'
                ) as HTMLButtonElement;
                activeTab?.click();
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deceasedChickens.map((chicken) => (
                <ChickenCard
                  key={chicken.id}
                  chicken={chicken}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mark as Deceased Dialog */}
      <MarkDeceasedDialog
        chicken={selectedChicken}
        open={isDeceasedDialogOpen}
        onOpenChange={setIsDeceasedDialogOpen}
        onConfirm={handleConfirmDeceased}
      />
    </div>
  );
}
