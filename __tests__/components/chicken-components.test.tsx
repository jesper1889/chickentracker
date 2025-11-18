/**
 * Chicken Components Tests
 *
 * Tests for frontend chicken management components.
 * Covers critical user interactions and rendering.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChickenCard from '@/components/chicken-card';
import EmptyState from '@/components/empty-state';
import { Chicken, Sex } from '@/lib/types/chicken';

describe('ChickenCard Component', () => {
  const mockChicken: Chicken = {
    id: 'test-id-1',
    userId: 'user-1',
    name: 'Henrietta',
    breed: 'Rhode Island Red',
    sex: Sex.HEN,
    birthDate: new Date('2024-01-01'),
    deathDate: null,
    photoMimeType: null,
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test('should render chicken name and breed', () => {
    render(<ChickenCard chicken={mockChicken} />);

    expect(screen.getByText('Henrietta')).toBeInTheDocument();
    expect(screen.getByText('Rhode Island Red')).toBeInTheDocument();
  });

  test('should display "Mark as Deceased" button for active chickens', () => {
    const onMarkDeceased = jest.fn();
    render(
      <ChickenCard chicken={mockChicken} onMarkDeceased={onMarkDeceased} />
    );

    const markButton = screen.getByText(/Mark as Deceased/i);
    expect(markButton).toBeInTheDocument();
  });

  test('should not display "Mark as Deceased" button for deceased chickens', () => {
    const deceasedChicken: Chicken = {
      ...mockChicken,
      deathDate: new Date('2024-11-01'),
    };

    render(<ChickenCard chicken={deceasedChicken} />);

    const markButton = screen.queryByText(/Mark as Deceased/i);
    expect(markButton).not.toBeInTheDocument();
  });

  test('should call onEdit when Edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<ChickenCard chicken={mockChicken} onEdit={onEdit} />);

    const editButton = screen.getByText(/Edit/i);
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockChicken.id);
  });

  test('should call onDelete when Delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<ChickenCard chicken={mockChicken} onDelete={onDelete} />);

    const deleteButton = screen.getByText(/Delete/i);
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockChicken.id);
  });

  test('should display deceased badge for deceased chickens', () => {
    const deceasedChicken: Chicken = {
      ...mockChicken,
      deathDate: new Date('2024-11-01'),
    };

    render(<ChickenCard chicken={deceasedChicken} />);

    expect(screen.getByText(/Deceased:/i)).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  test('should render title and description', () => {
    render(
      <EmptyState
        title="No Chickens"
        description="Add your first chicken to get started"
      />
    );

    expect(screen.getByText('No Chickens')).toBeInTheDocument();
    expect(screen.getByText('Add your first chicken to get started')).toBeInTheDocument();
  });

  test('should render action button when provided', () => {
    const onAction = jest.fn();

    render(
      <EmptyState
        title="No Chickens"
        description="Add your first chicken"
        actionLabel="Add Chicken"
        onAction={onAction}
      />
    );

    const button = screen.getByText('Add Chicken');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onAction).toHaveBeenCalled();
  });

  test('should not render action button when not provided', () => {
    render(
      <EmptyState
        title="No Chickens"
        description="Add your first chicken"
      />
    );

    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });
});
