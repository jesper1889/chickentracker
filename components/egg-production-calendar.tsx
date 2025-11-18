/**
 * EggProductionCalendar Component
 *
 * Displays a monthly calendar view with egg production counts for each day.
 * Users can click any day to add/edit an entry for that date.
 *
 * Features:
 * - Month navigation with previous/next buttons
 * - Month/year selector for quick navigation
 * - Displays egg count directly on calendar days
 * - Highlights current day
 * - Click day to open add/edit dialog
 * - Empty state for months with no data
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EggProduction } from '@/lib/types/egg-production';

interface EggProductionCalendarProps {
  entries: EggProduction[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
}

export default function EggProductionCalendar({
  entries,
  currentMonth,
  onMonthChange,
  onDayClick,
}: EggProductionCalendarProps) {
  const [viewMonth, setViewMonth] = useState(currentMonth);

  // Create a map of entries by date for quick lookup
  const entryMap = new Map<string, EggProduction>();
  entries.forEach((entry) => {
    const dateStr = entry.date instanceof Date
      ? entry.date.toISOString().split('T')[0]
      : new Date(entry.date).toISOString().split('T')[0];
    entryMap.set(dateStr, entry);
  });

  // Get the first day of the month and number of days
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Get today's date
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  /**
   * Navigate to previous month
   */
  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setViewMonth(newDate);
    onMonthChange(newDate);
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setViewMonth(newDate);
    onMonthChange(newDate);
  };

  /**
   * Navigate to current month
   */
  const handleToday = () => {
    const newDate = new Date();
    setViewMonth(newDate);
    onMonthChange(newDate);
  };

  /**
   * Handle day click to open add/edit dialog
   */
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    onDayClick(clickedDate);
  };

  // Create array of weeks with days
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(startingDayOfWeek).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Fill remaining cells in last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  // Month and year formatting
  const monthYear = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl font-bold text-amber-900">
            {monthYear}
          </CardTitle>
          {!isCurrentMonth && (
            <Button
              onClick={handleToday}
              variant="outline"
              size="sm"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              Today
            </Button>
          )}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevMonth}
            variant="outline"
            size="sm"
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-sm text-amber-700 font-medium">
            {month === 0 ? 'January' : month === 1 ? 'February' : month === 2 ? 'March' : month === 3 ? 'April' : month === 4 ? 'May' : month === 5 ? 'June' : month === 6 ? 'July' : month === 7 ? 'August' : month === 8 ? 'September' : month === 9 ? 'October' : month === 10 ? 'November' : 'December'} {year}
          </div>

          <Button
            onClick={handleNextMonth}
            variant="outline"
            size="sm"
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-amber-700 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const isCurrentDay = isCurrentMonth && day === today.getDate();
              const dateStr = day
                ? new Date(year, month, day).toISOString().split('T')[0]
                : null;
              const entry = dateStr ? entryMap.get(dateStr) : null;

              return (
                <button
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => day && handleDayClick(day)}
                  disabled={!day}
                  className={`
                    aspect-square p-1 rounded-lg text-sm font-medium
                    transition-colors border-2
                    ${
                      !day
                        ? 'bg-transparent'
                        : isCurrentDay
                          ? 'border-amber-500 bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : entry
                            ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-amber-50'
                    }
                  `}
                >
                  {day && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-xs">{day}</div>
                      {entry && (
                        <div className="text-xs font-bold text-amber-600 mt-0.5">
                          {entry.count}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Click any day to add or edit an egg count
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
