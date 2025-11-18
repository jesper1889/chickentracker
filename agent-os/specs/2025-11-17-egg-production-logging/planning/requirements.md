# Requirements: Daily Egg Production Logging

## Overview
System to log daily egg production totals with calendar view and monthly aggregates.

## Core Requirements

### Data Model
- **Daily total count only** - not per-chicken tracking
- **No metadata** - no size, color, or quality tracking
- **Date only** - no time/timestamp tracking
- **User agnostic** - shared data, no tracking of who entered what

### User Interface

#### Calendar View
- Click any day to add/edit egg count
- Display egg counts directly on calendar days
- Default to current month
- Navigation to view previous/future months
- Support explicit "0 eggs" logging
- Blank days treated as "not recorded yet"

#### Monthly Aggregate Table
- Display last 6 months
- Show month name + total eggs
- Most recent month first
- No averages displayed

### User Actions
- **Add**: Click calendar day or use add button
- **Edit**: Two methods
  - Click directly on calendar day
  - Use separate edit button in table
- **Delete**: Remove entries

### Data Sharing
- Both users have same rights (add, edit, delete)
- No user attribution on entries
- Shared view of all data

## Out of Scope
- Forecasting
- Alerts
- CSV export
- Notifications
- Per-chicken tracking
- Metadata (size, color, quality)
- Time tracking
- Averages
- User attribution

## Technical Context
- Builds on Feature #1 (Authentication) and Feature #2 (Chicken Profiles)
- Uses existing tech stack: Next.js, TypeScript, React, PostgreSQL, Prisma
- Follows established patterns from previous features
