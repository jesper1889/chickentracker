/**
 * MonthlyAggregateTable Component
 *
 * Displays a table summarizing egg production for the last 6 months.
 * Shows month name, total egg count, and days recorded.
 * Most recent month is displayed first.
 *
 * Features:
 * - 6-month summary with most recent first
 * - Total eggs row at the bottom
 * - Responsive table layout
 * - Empty state if no data exists
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/empty-state';

interface MonthlyData {
  month: string; // YYYY-MM format
  totalCount: number;
  daysRecorded: number;
}

interface MonthlyAggregateTableProps {
  monthlyData: MonthlyData[];
}

export default function MonthlyAggregateTable({
  monthlyData,
}: MonthlyAggregateTableProps) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-amber-900">
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No Data Yet"
            description="Add egg production entries to see your monthly summary."
          />
        </CardContent>
      </Card>
    );
  }

  // Format month string (YYYY-MM) to display name
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Calculate total eggs across all months
  const totalEggs = monthlyData.reduce((sum, m) => sum + m.totalCount, 0);
  const totalDaysRecorded = monthlyData.reduce((sum, m) => sum + m.daysRecorded, 0);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-amber-900">
          Monthly Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-amber-200 bg-amber-50">
                <TableHead className="text-amber-900 font-semibold">
                  Month
                </TableHead>
                <TableHead className="text-right text-amber-900 font-semibold">
                  Total Eggs
                </TableHead>
                <TableHead className="text-right text-amber-900 font-semibold">
                  Days Recorded
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((data) => (
                <TableRow
                  key={data.month}
                  className="border-gray-200 hover:bg-amber-50 transition-colors"
                >
                  <TableCell className="font-medium text-gray-700">
                    {formatMonth(data.month)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-amber-700">
                    {data.totalCount}
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {data.daysRecorded}
                  </TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="border-t-2 border-amber-300 bg-amber-50 font-bold">
                <TableCell className="text-amber-900">Total</TableCell>
                <TableCell className="text-right text-amber-900">
                  {totalEggs}
                </TableCell>
                <TableCell className="text-right text-amber-900">
                  {totalDaysRecorded}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
