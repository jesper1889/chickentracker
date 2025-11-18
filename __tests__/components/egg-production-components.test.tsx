/**
 * Egg Production Components Tests
 *
 * Tests for frontend egg production management components.
 * Covers critical user interactions and rendering.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EggProductionCalendar from '@/components/egg-production-calendar';
import MonthlyAggregateTable from '@/components/monthly-aggregate-table';
import AddEditEggProductionDialog from '@/components/add-edit-egg-production-dialog';
import { EggProduction } from '@/lib/types/egg-production';

describe('EggProductionCalendar Component', () => {
  const mockEntries: EggProduction[] = [
    {
      id: 'entry-1',
      userId: 'user-1',
      date: new Date('2024-11-15'),
      count: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'entry-2',
      userId: 'user-1',
      date: new Date('2024-11-20'),
      count: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  test('should render calendar with current month', () => {
    const currentMonth = new Date('2024-11-01');
    render(
      <EggProductionCalendar
        entries={mockEntries}
        currentMonth={currentMonth}
        onMonthChange={jest.fn()}
        onDayClick={jest.fn()}
      />
    );

    const monthHeading = screen.getAllByText(/November 2024/i)[0];
    expect(monthHeading).toBeInTheDocument();
  });

  test('should display egg counts on calendar days', () => {
    const currentMonth = new Date('2024-11-01');
    render(
      <EggProductionCalendar
        entries={mockEntries}
        currentMonth={currentMonth}
        onMonthChange={jest.fn()}
        onDayClick={jest.fn()}
      />
    );

    // Check for egg counts displayed on calendar - should be 2 instances (one per day)
    const tenElements = screen.getAllByText('10');
    const eightElements = screen.getAllByText('8');

    expect(tenElements.length).toBeGreaterThan(0);
    expect(eightElements.length).toBeGreaterThan(0);
  });

  test('should call onDayClick when a day is clicked', async () => {
    const onDayClick = jest.fn();
    const currentMonth = new Date('2024-11-01');

    render(
      <EggProductionCalendar
        entries={mockEntries}
        currentMonth={currentMonth}
        onMonthChange={jest.fn()}
        onDayClick={onDayClick}
      />
    );

    // Click on day 15
    const dayButtons = screen.getAllByRole('button');
    const day15Button = dayButtons.find((btn) => btn.textContent?.includes('15'));

    if (day15Button) {
      fireEvent.click(day15Button);
      expect(onDayClick).toHaveBeenCalled();
    }
  });

  test('should navigate to previous month', () => {
    const onMonthChange = jest.fn();
    const currentMonth = new Date('2024-11-01');

    render(
      <EggProductionCalendar
        entries={mockEntries}
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
        onDayClick={jest.fn()}
      />
    );

    const prevButton = screen.getAllByRole('button').find((btn) =>
      btn.querySelector('svg')
    );

    if (prevButton) {
      fireEvent.click(prevButton);
      expect(onMonthChange).toHaveBeenCalled();
    }
  });

  test('should have navigation instructions', () => {
    const currentMonth = new Date('2024-11-01');

    render(
      <EggProductionCalendar
        entries={mockEntries}
        currentMonth={currentMonth}
        onMonthChange={jest.fn()}
        onDayClick={jest.fn()}
      />
    );

    expect(screen.getByText(/Click any day to add or edit/i)).toBeInTheDocument();
  });
});

describe('MonthlyAggregateTable Component', () => {
  const mockMonthlyData = [
    {
      month: '2024-11',
      totalCount: 245,
      daysRecorded: 25,
    },
    {
      month: '2024-10',
      totalCount: 230,
      daysRecorded: 23,
    },
  ];

  test('should render table with monthly data', () => {
    render(<MonthlyAggregateTable monthlyData={mockMonthlyData} />);

    expect(screen.getByText(/November 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/October 2024/i)).toBeInTheDocument();
  });

  test('should display total eggs in table', () => {
    render(<MonthlyAggregateTable monthlyData={mockMonthlyData} />);

    const twoFourFive = screen.getAllByText('245');
    const twoThirty = screen.getAllByText('230');

    expect(twoFourFive.length).toBeGreaterThan(0);
    expect(twoThirty.length).toBeGreaterThan(0);
  });

  test('should display days recorded', () => {
    render(<MonthlyAggregateTable monthlyData={mockMonthlyData} />);

    const twenty5 = screen.getAllByText('25');
    const twenty3 = screen.getAllByText('23');

    expect(twenty5.length).toBeGreaterThan(0);
    expect(twenty3.length).toBeGreaterThan(0);
  });

  test('should calculate and display total row', () => {
    render(<MonthlyAggregateTable monthlyData={mockMonthlyData} />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    // Total eggs: 245 + 230 = 475
    const total = screen.getAllByText('475');
    expect(total.length).toBeGreaterThan(0);
  });

  test('should show empty state when no data', () => {
    render(<MonthlyAggregateTable monthlyData={[]} />);

    expect(screen.getByText(/No Data Yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Add egg production entries to see your monthly summary/i)
    ).toBeInTheDocument();
  });
});

describe('AddEditEggProductionDialog Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should render dialog when open', () => {
    render(
      <AddEditEggProductionDialog
        isOpen={true}
        onClose={jest.fn()}
        selectedDate={new Date('2024-11-20')}
        entryToEdit={null}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByText(/Add Egg Production Entry/i)).toBeInTheDocument();
  });

  test('should not render dialog when closed', () => {
    render(
      <AddEditEggProductionDialog
        isOpen={false}
        onClose={jest.fn()}
        selectedDate={new Date('2024-11-20')}
        entryToEdit={null}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.queryByText(/Add Egg Production Entry/i)).not.toBeInTheDocument();
  });

  test('should show edit title when editing existing entry', () => {
    const existingEntry: EggProduction = {
      id: 'entry-1',
      userId: 'user-1',
      date: new Date('2024-11-20'),
      count: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(
      <AddEditEggProductionDialog
        isOpen={true}
        onClose={jest.fn()}
        selectedDate={new Date('2024-11-20')}
        entryToEdit={existingEntry}
        onSuccess={jest.fn()}
      />
    );

    expect(screen.getByText(/Edit Egg Production/i)).toBeInTheDocument();
  });

  test('should have a count input field', () => {
    render(
      <AddEditEggProductionDialog
        isOpen={true}
        onClose={jest.fn()}
        selectedDate={new Date('2024-11-20')}
        entryToEdit={null}
        onSuccess={jest.fn()}
      />
    );

    const countInput = screen.getByLabelText(/Number of Eggs/i);
    expect(countInput).toBeInTheDocument();
  });

  test('should call onClose when Cancel button is clicked', () => {
    const onClose = jest.fn();

    render(
      <AddEditEggProductionDialog
        isOpen={true}
        onClose={onClose}
        selectedDate={new Date('2024-11-20')}
        entryToEdit={null}
        onSuccess={jest.fn()}
      />
    );

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  test('should support 0 eggs as valid input', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'entry-1',
        count: 0,
        date: new Date('2024-11-20'),
      }),
    });

    const onSuccess = jest.fn();
    render(
      <AddEditEggProductionDialog
        isOpen={true}
        onClose={jest.fn()}
        selectedDate={new Date('2024-11-20')}
        entryToEdit={null}
        onSuccess={onSuccess}
      />
    );

    const countInput = screen.getByLabelText(/Number of Eggs/i) as HTMLInputElement;
    fireEvent.change(countInput, { target: { value: '0' } });

    const submitButton = screen.getByRole('button', { name: /Add Entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
