/**
 * EggProductionClient Component
 *
 * Client-side interactive component for managing egg production entries.
 * Manages state for calendar, monthly data, and dialog interactions.
 *
 * Features:
 * - Display calendar with month navigation
 * - Display monthly aggregate table
 * - Handle add/edit/delete operations via API
 * - Loading and error states
 * - Optimistic UI updates
 * - Error handling with user feedback
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import EggProductionCalendar from '@/components/egg-production-calendar';
import MonthlyAggregateTable from '@/components/monthly-aggregate-table';
import AddEditEggProductionDialog from '@/components/add-edit-egg-production-dialog';
import { EggProduction } from '@/lib/types/egg-production';
import { Plus } from 'lucide-react';

interface MonthlyData {
  month: string;
  totalCount: number;
  daysRecorded: number;
}

export default function EggProductionClient() {
  const router = useRouter();

  // State management
  const [entries, setEntries] = useState<EggProduction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [entryToEdit, setEntryToEdit] = useState<EggProduction | null>(null);

  /**
   * Fetch egg production entries for current month
   */
  const fetchEntries = async (date: Date = new Date()) => {
    try {
      setError(null);
      const year = date.getFullYear();
      const month = date.getMonth();

      // Get first and last day of month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const response = await fetch(
        `/api/egg-production?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }

      const data = await response.json();

      // Convert dates to Date objects
      const typedEntries: EggProduction[] = data.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      }));

      setEntries(typedEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
      console.error('Error fetching entries:', err);
    }
  };

  /**
   * Fetch monthly aggregated data
   */
  const fetchMonthlyData = async () => {
    try {
      const response = await fetch('/api/egg-production/monthly');

      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }

      const data = await response.json();
      setMonthlyData(data);
    } catch (err) {
      console.error('Error fetching monthly data:', err);
      // Don't set error for monthly data, it's supplementary
    }
  };

  /**
   * Initial load on component mount
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchEntries(currentMonth),
        fetchMonthlyData(),
      ]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  /**
   * Refetch entries when month changes
   */
  useEffect(() => {
    fetchEntries(currentMonth);
  }, [currentMonth]);

  /**
   * Handle month change in calendar
   */
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  /**
   * Handle day click in calendar
   */
  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingEntry = entries.find((e) => {
      const entryDateStr = e.date instanceof Date
        ? e.date.toISOString().split('T')[0]
        : new Date(e.date).toISOString().split('T')[0];
      return entryDateStr === dateStr;
    });

    setSelectedDate(date);
    setEntryToEdit(existingEntry || null);
    setIsDialogOpen(true);
  };

  /**
   * Handle add button click
   */
  const handleAddEntry = () => {
    setSelectedDate(new Date());
    setEntryToEdit(null);
    setIsDialogOpen(true);
  };

  /**
   * Handle successful dialog submission
   */
  const handleDialogSuccess = async () => {
    // Refetch data
    await Promise.all([
      fetchEntries(currentMonth),
      fetchMonthlyData(),
    ]);
  };

  /**
   * Handle dialog close
   */
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedDate(null);
    setEntryToEdit(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">Egg Production</h1>
        <Button
          onClick={handleAddEntry}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200"
          role="alert"
        >
          {error}
          <Button
            onClick={() => {
              fetchEntries(currentMonth);
              fetchMonthlyData();
            }}
            variant="outline"
            size="sm"
            className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Calendar */}
      <EggProductionCalendar
        entries={entries}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        onDayClick={handleDayClick}
      />

      {/* Monthly Aggregate Table */}
      <MonthlyAggregateTable monthlyData={monthlyData} />

      {/* Add/Edit Dialog */}
      <AddEditEggProductionDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        selectedDate={selectedDate}
        entryToEdit={entryToEdit}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
