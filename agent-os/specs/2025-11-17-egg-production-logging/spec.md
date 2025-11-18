# Specification: Daily Egg Production Logging

## Goal
Create a system to log, track, and view daily egg production totals with an interactive calendar interface and monthly aggregate summaries, enabling users to monitor their flock's productivity over time.

## User Stories
- As a farmer, I want to log the daily total egg count so that I can track my flock's productivity
- As a farmer, I want to view egg production in a calendar format so that I can easily see trends by month
- As a farmer, I want to see monthly egg production totals so that I can analyze performance across different periods

## Specific Requirements

**Data Model (EggProduction)**
- Store date as date-only (no time tracking)
- Store count as integer representing total eggs collected that day
- Support "0 eggs" as a valid count (explicit logging)
- Allow null/undefined for unrecorded days (blank days on calendar)
- No metadata tracking (size, color, quality, per-chicken attribution)
- Keep data simple: date and count fields only
- Use date as unique identifier per day (one record per day maximum)

**Database Schema and Migrations**
- Create EggProduction model in Prisma schema with id, date, count, createdAt, updatedAt fields
- Add relation to User model for data isolation (users see only their own data)
- Create migration to add EggProduction table with indexes on userId and date
- Support cascading delete when user is deleted
- Add unique constraint on (userId, date) to prevent duplicate daily entries

**API Routes**
- POST /api/egg-production - Create/log egg count for a specific date
- PUT /api/egg-production/[id] - Update existing daily egg count entry
- GET /api/egg-production - List entries with optional date range filters
- GET /api/egg-production/monthly - Return aggregated monthly totals for last 6 months
- DELETE /api/egg-production/[id] - Remove entry
- All routes require authentication; users can only access/modify their own data
- Return 401 for unauthenticated requests, 403 for unauthorized access
- Validate count is non-negative integer (0 or greater)

**Calendar View Component**
- Display calendar showing current month with navigation controls
- Show egg count directly on each calendar day (if recorded)
- Blank/empty days indicate no entry recorded for that date
- Click on any day to open add/edit dialog
- Support "Add Entry" button to create new entry
- Show loading and error states during API operations
- Display month/year in header with prev/next month navigation
- Highlight current day with visual indicator
- Support jumping to specific month via month/year selector

**Monthly Aggregate Table**
- Display last 6 months of data in table format
- Show month name (e.g., "November 2025"), total egg count
- Sort with most recent month first
- Include total eggs across all 6 months shown
- Support basic sorting/filtering by clicking column headers
- Display table below calendar view for easy reference
- Show "No data" state if no entries exist for a month

**Add/Edit Dialog**
- Display form with date picker and count input field
- Pre-fill date field with selected calendar day
- Pre-fill count field with existing value if editing
- Show validation errors inline (negative numbers, non-integers)
- Prevent dates in future (validation on client and server)
- Support explicit "0 eggs" entries without error
- Show confirmation message on successful save
- Close dialog automatically on successful submission

**Validation and Error Handling**
- Validate count is integer >= 0 (no negative, no decimals)
- Validate date is valid date and not in future
- Return 400 with error details for validation failures
- Show user-friendly error messages for API failures
- Log all errors server-side for debugging
- Gracefully handle network timeouts with retry UI

**Testing Requirements**
- Unit tests for EggProduction Zod validation schema
- API tests for POST/PUT/GET/DELETE routes with authentication checks
- API tests for unauthorized access attempts (403 Forbidden)
- API tests for monthly aggregation query
- Component tests for calendar rendering with sample data
- Component tests for add/edit dialog form submission
- Component tests for error state handling
- Integration tests for full CRUD workflow
- Test that users cannot access other users' data

**Technology Stack and Patterns**
- Use Zod for data validation (egg count, date) matching existing chickenSchema pattern
- Follow existing API route structure with auth checks, error handling, and Prisma queries
- Create egg-production validation schema similar to lib/validations/chicken.ts
- Create EggProduction TypeScript type in lib/types/ matching Chicken type pattern
- Use existing UI components (Dialog, Button, Input, Card) from components/ui/
- Implement client-side state management with useState (match chicken-list-client.tsx pattern)
- Use React Hook Form for form handling matching existing edit-chicken-form.tsx pattern
- Use Prisma for database queries matching existing chicken routes pattern
- Use NextAuth for authentication checks matching existing API patterns

## Existing Code to Leverage

**API Routes Pattern (/app/api/chickens/route.ts, /app/api/chickens/[id]/route.ts)**
- Structure egg-production routes with identical authentication and error handling patterns
- Use auth() check at start of each route handler to verify session and user.id
- Return NextResponse.json with appropriate status codes (201, 200, 400, 401, 403, 404, 500)
- Use Prisma client instance for database operations
- Implement Zod validation with detailed error responses including field and message
- Exclude sensitive data from responses (photo buffers are excluded in chickens, exclude raw data where needed)
- Use select clause in Prisma queries to control response fields

**Validation Schema Pattern (lib/validations/chicken.ts)**
- Create eggProductionSchema with Zod object defining all fields
- Include .refine() for cross-field validation (e.g., date not in future)
- Export inferred TypeScript type (EggProductionFormData)
- Add JSDoc comments explaining business rules and validation constraints
- Validate date with .date() and .max(new Date()) for "no future dates" rule
- Validate count with .number().int().min(0) for egg count validation

**Component Pattern (chicken-list-client.tsx, edit-chicken-form.tsx)**
- Create egg-production-client component with useState for local state
- Implement CRUD operations via API calls with error handling
- Show error alerts and success feedback to users
- Use existing dialog/form UI components from components/ui/
- Follow responsive grid layout patterns (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- Implement optimistic UI updates after successful operations
- Add loading states during API calls

**Type System Pattern (lib/types/chicken.ts)**
- Create EggProduction interface matching Prisma model shape
- Create EggProductionFormInput for form data before submission
- Include JSDoc comments explaining each interface
- Export types for use in components and API handlers

**Test Pattern (__tests__/api/chickens.test.ts)**
- Create beforeAll hook to set up test user(s) and clean up test data
- Use Prisma client for database operations in tests
- Create test records for each test case
- Assert response status codes and returned data structure
- Test both success and error scenarios (401, 403, 404, validation)
- Use consistent test naming (should..., when...) matching existing pattern
- Clean up test data after tests complete

## Out of Scope
- Forecasting or prediction models for future production
- Alerts or notifications when production drops below threshold
- CSV export or data download functionality
- Per-chicken egg production tracking
- Metadata tracking (egg size, color, grade, quality)
- Time-of-day tracking (only date is tracked)
- User attribution or entry history logging
- Averaging or statistical calculations beyond monthly totals
- Multi-flock support (single shared egg production log for all users)
- Photo uploads or attachments for production entries
- Production goals or targets
