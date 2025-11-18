# Task Breakdown: Daily Egg Production Logging

## Overview
Total Tasks: 42 sub-tasks organized across 5 task groups

## Task List

### Database Layer

#### Task Group 1: Data Models and Migrations
**Dependencies:** None

- [x] 1.0 Complete database layer for EggProduction
  - [x] 1.1 Write 2-8 focused tests for EggProduction model and validation
    - Test creating an egg production entry with valid data (date + count)
    - Test validating count as non-negative integer
    - Test date cannot be in future (server-side validation)
    - Test unique constraint on (userId, date) prevents duplicates
    - Test user isolation: users can only see their own data
    - Skip: exhaustive edge cases, performance tests
  - [x] 1.2 Create EggProduction Zod validation schema
    - Location: `lib/validations/egg-production.ts`
    - Reuse pattern from: `lib/validations/chicken.ts`
    - Fields: date (required, date type), count (required, non-negative integer)
    - Validations:
      - count: `.number().int().min(0)` (no decimals, no negative)
      - date: `.date().max(new Date())` (not in future)
    - Add `.refine()` for cross-field validation if needed
    - Export inferred type: `EggProductionFormData`
  - [x] 1.3 Create EggProduction TypeScript types
    - Location: `lib/types/egg-production.ts`
    - Reuse pattern from: `lib/types/chicken.ts`
    - Interface EggProduction: id, userId, date, count, createdAt, updatedAt
    - Interface EggProductionFormInput: date, count (for form data)
    - Add JSDoc comments explaining business rules
  - [x] 1.4 Update Prisma schema to add EggProduction model
    - Location: `prisma/schema.prisma`
    - Fields: id (String @id @default(cuid())), userId (String), date (DateTime @db.Date), count (Int), createdAt (DateTime @default(now())), updatedAt (DateTime @updatedAt)
    - Relation: @relation("EggProduction", fields: [userId], references: [id], onDelete: Cascade)
    - Add unique constraint: @@unique([userId, date]) to prevent duplicate daily entries
    - Add index: @@index([userId]) for query performance
    - Add index: @@index([date]) for calendar range queries
  - [x] 1.5 Create Prisma migration for EggProduction table
    - Location: `prisma/migrations/[timestamp]_add_egg_production/migration.sql`
    - Create egg_production table with columns: id, userId (FK to users), date, count, createdAt, updatedAt
    - Add unique constraint on (userId, date)
    - Add indexes on userId and date for query performance
    - Enable cascading delete for userId foreign key
  - [x] 1.6 Set up User model relation to EggProduction
    - Location: `prisma/schema.prisma`
    - Add relation: eggProductions EggProduction[]
    - Verify cascading delete is properly configured
  - [x] 1.7 Ensure database layer tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify Zod schema validates correctly
    - Verify migrations run successfully: `npx prisma migrate dev`
    - Verify associations work in test environment

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass
- EggProduction model validates date and count correctly
- Prisma migration creates table with all required indexes and constraints
- Unique (userId, date) constraint prevents duplicates
- User isolation enforced at database level

### API Layer

#### Task Group 2: API Endpoints and Validation
**Dependencies:** Task Group 1

- [x] 2.0 Complete API layer with 5 endpoints
  - [x] 2.1 Write 2-8 focused tests for API endpoints
    - Test POST creates entry with valid date and count
    - Test GET lists entries for authenticated user only
    - Test PUT updates existing entry
    - Test DELETE removes entry
    - Test 401 returned for unauthenticated requests
    - Test 403 returned when accessing another user's data
    - Test 400 returned for invalid count (negative, decimal)
    - Skip: exhaustive scenario testing, all validation combinations
  - [x] 2.2 Create POST /api/egg-production endpoint
    - Location: `app/api/egg-production/route.ts`
    - Reuse pattern from: `app/api/chickens/route.ts`
    - Check authentication: `auth()` at start
    - Accept JSON body: { date: Date, count: number }
    - Validate with eggProductionSchema
    - Create entry in database with userId
    - Return 201 with created entry
    - Return 400 for validation errors (include field, message in details)
    - Return 401 for unauthenticated
    - Return 500 on server error with console logging
  - [x] 2.3 Create GET /api/egg-production endpoint
    - Location: `app/api/egg-production/route.ts` (in GET handler)
    - Check authentication
    - Accept optional query params: startDate, endDate (ISO date strings)
    - Query entries for authenticated user with date range filter
    - Order by date descending
    - Use select clause to exclude unnecessary fields
    - Return 200 with array of entries
    - Return 401 for unauthenticated
  - [x] 2.4 Create PUT /api/egg-production/[id] endpoint
    - Location: `app/api/egg-production/[id]/route.ts`
    - Reuse pattern from: `app/api/chickens/[id]/route.ts`
    - Check authentication
    - Verify entry belongs to authenticated user (403 if not)
    - Accept JSON body: { date: Date, count: number }
    - Validate with eggProductionSchema
    - Update entry in database
    - Return 200 with updated entry
    - Return 400 for validation errors
    - Return 401 for unauthenticated
    - Return 403 for unauthorized access
    - Return 404 if entry not found
  - [x] 2.5 Create DELETE /api/egg-production/[id] endpoint
    - Location: `app/api/egg-production/[id]/route.ts` (in DELETE handler)
    - Check authentication
    - Verify entry belongs to authenticated user (403 if not)
    - Delete entry from database
    - Return 200 with confirmation message
    - Return 401 for unauthenticated
    - Return 403 for unauthorized access
    - Return 404 if entry not found
  - [x] 2.6 Create GET /api/egg-production/monthly endpoint
    - Location: `app/api/egg-production/monthly/route.ts`
    - Check authentication
    - Query last 6 months of data for authenticated user
    - Aggregate count by month using Prisma groupBy or raw SQL
    - Return array with: month (YYYY-MM format), totalCount, and count of days recorded
    - Sort by month descending (most recent first)
    - Return 200 with aggregated data
    - Return 401 for unauthenticated
  - [x] 2.7 Implement proper error handling for all endpoints
    - Handle ZodError with 400 status and detailed field/message
    - Handle Prisma errors (unique violation) with 400 status
    - Log all errors to console for server-side debugging
    - Return user-friendly error messages
    - Return appropriate HTTP status codes (401, 403, 404, 400, 500)
  - [x] 2.8 Ensure API layer tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify all 5 endpoints work correctly
    - Verify authentication and authorization checks
    - Verify validation errors return 400 with details

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass
- All 5 API endpoints work and enforce authentication
- Users can only access/modify their own data (403 enforced)
- Validation errors return 400 with field-level details
- Monthly aggregation query returns correct totals

### Frontend Components

#### Task Group 3: UI Components and Pages
**Dependencies:** Task Group 2

- [x] 3.0 Complete UI components and pages
  - [x] 3.1 Write 2-8 focused tests for UI components
    - Test calendar renders current month with correct day grid
    - Test clicking a day opens the add/edit dialog
    - Test form submits with valid date and count
    - Test validation errors display inline
    - Test monthly aggregate table displays 6 months
    - Test delete button removes entry
    - Test loading and error states display
    - Skip: exhaustive component state testing, accessibility audit
  - [x] 3.2 Create EggProductionCalendar component
    - Location: `components/egg-production-calendar.tsx`
    - Display calendar for current month (default)
    - Show month/year in header
    - Display prev/next buttons for month navigation
    - Show month/year selector for jumping to specific month
    - Display egg count directly on calendar day cells
    - Highlight current day with visual indicator
    - Blank cells for days without recorded entries
    - Render empty state if no entries for month
    - Click day to open add/edit dialog
    - Props: entries (EggProduction[]), onDayClick (date) => void, onEdit, onDelete
  - [x] 3.3 Create MonthlyAggregateTable component
    - Location: `components/monthly-aggregate-table.tsx`
    - Display table with columns: Month, Total Eggs, Days Recorded
    - Populate with last 6 months of data (from API)
    - Sort with most recent month first
    - Show row with total eggs across all 6 months
    - Display "No data" message if no entries exist
    - Support click on row to highlight/focus (optional)
    - Props: monthlyData (aggregated data from API)
  - [x] 3.4 Create AddEditEggProductionDialog component
    - Location: `components/add-edit-egg-production-dialog.tsx`
    - Reuse pattern from: existing dialog components
    - Form fields:
      - Date picker (pre-filled with selected date)
      - Count input field (numeric, non-negative)
    - Use React Hook Form for form handling
    - Match pattern from: `components/edit-chicken-form.tsx`
    - Validate client-side: count >= 0, date not in future
    - Show inline validation errors
    - Submit to API (POST for create, PUT for edit)
    - Show loading state during submission
    - Show success confirmation message
    - Close dialog automatically on success
    - Show error alert for API failures with retry option
    - Props: isOpen, onClose, selectedDate, entryToEdit?, onSuccess
  - [x] 3.5 Create EggProductionPage component
    - Location: `app/egg-production/page.tsx`
    - Reuse pattern from: `app/chickens/page.tsx`
    - Layout: calendar view on top, monthly aggregate table below
    - Add "Add Entry" button (same effect as clicking calendar day)
    - Fetch entries and monthly data on mount
    - Handle loading state with skeleton/spinner
    - Handle error state with retry button
    - Manage dialog open/close state
    - Manage selected date state
    - Pass props to calendar and table components
    - Handle add, edit, delete operations via API
    - Use useState for local state (entries, monthlyData, dialog state)
    - Use useEffect for data fetching
  - [x] 3.6 Create client-side egg-production-client component
    - Location: `components/egg-production-client.tsx`
    - Reuse pattern from: `components/chicken-list-client.tsx`
    - Separate server vs client concerns
    - Manage client-side state: entries, monthlyData, loading, error
    - Implement CRUD operations via API calls
    - Show error alerts and success feedback
    - Handle optimistic UI updates
    - Implement retry logic for failed API calls
    - Export component for use in layout
  - [x] 3.7 Apply base styles and responsive design
    - Use existing design system and component library
    - Follow grid layout patterns (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
    - Apply Tailwind CSS classes for spacing, colors, typography
    - Responsive breakpoints: mobile (320px), tablet (768px), desktop (1024px+)
    - Ensure calendar is readable on all screen sizes
    - Ensure table is scrollable/responsive on mobile
    - Match visual style from chicken profiles feature
  - [x] 3.8 Add interactions and loading states
    - Hover states for clickable elements
    - Button feedback on click (disabled during submission)
    - Loading spinner during API calls
    - Success toast/confirmation message
    - Error message with clear user-friendly text
    - Smooth transitions for dialog open/close
    - Transition for day selection/highlighting
  - [x] 3.9 Add navigation to egg production feature
    - Location: Update main navigation/sidebar
    - Add link to `/app/egg-production` page
    - Include label: "Egg Production" or similar
    - Use existing navigation pattern from other features
  - [x] 3.10 Ensure UI component tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify critical component behaviors work
    - Verify form validation and submission
    - Verify calendar day selection

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- Calendar renders correctly with month navigation
- Monthly aggregate table displays 6 months
- Add/edit dialog submits valid data to API
- All components handle loading and error states
- Responsive design works on mobile, tablet, desktop
- Navigation link to egg production page works

### Validation and Error Handling

#### Task Group 4: Cross-Layer Validation Setup
**Dependencies:** Task Groups 1-2

- [x] 4.0 Set up comprehensive validation across layers
  - [x] 4.1 Verify client-side validation matches server-side
    - Ensure eggProductionSchema is used in form validation
    - Ensure date picker prevents future dates
    - Ensure count input only accepts integers >= 0
    - Test client validation with invalid inputs
  - [x] 4.2 Implement consistent error response format
    - All endpoints return { error: string, details?: [] } structure
    - Details array contains { field, message } for validation errors
    - Match existing error format from chicken API
  - [x] 4.3 Add user-friendly error messages for common cases
    - "Invalid count: must be a whole number 0 or greater"
    - "Invalid date: cannot be in the future"
    - "You don't have permission to modify this entry"
    - "Entry not found"
    - "Failed to save. Please try again."
  - [x] 4.4 Test validation parity between client and server
    - Submit invalid data from client and verify 400 response
    - Verify error messages are consistent and helpful

**Acceptance Criteria:**
- Client and server validation rules match
- All error responses have consistent format
- Error messages are user-friendly and actionable

### Testing and Integration

#### Task Group 5: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-4

- [ ] 5.0 Review existing tests and fill critical gaps only
  - [ ] 5.1 Review all tests written in previous task groups
    - Review the 2-8 tests from Task 1.1 (database layer)
    - Review the 2-8 tests from Task 2.1 (API endpoints)
    - Review the 2-8 tests from Task 3.1 (UI components)
    - Total existing tests: approximately 6-24 tests
    - Document which critical workflows are covered
  - [ ] 5.2 Analyze test coverage gaps for THIS feature only
    - Identify critical user workflows that lack test coverage:
      - User adds entry via calendar click -> table shows updated totals
      - User edits entry via calendar click -> entry updates correctly
      - User deletes entry -> table refreshes
      - Monthly aggregation calculates correctly for 6+ months
      - User navigates between months -> data updates
    - Focus ONLY on gaps related to egg production feature
    - Prioritize end-to-end integration tests over unit test gaps
    - Skip: exhaustive state combinations, all error scenarios
  - [ ] 5.3 Write up to 10 additional strategic integration tests
    - Test full user workflow: add entry -> view in calendar -> see in monthly table
    - Test editing an entry updates both calendar and monthly totals
    - Test deleting an entry removes from calendar and updates monthly totals
    - Test monthly aggregation returns correct totals for 6 months
    - Test month navigation updates calendar and table data
    - Maximum 10 new tests to fill identified critical gaps
    - Focus on integration between components and API
    - Skip edge cases, performance, accessibility unless business-critical
  - [ ] 5.4 Run all feature-specific tests
    - Run tests from 1.1 (database), 2.1 (API), 3.1 (UI), and 5.3 (integration)
    - Expected total: approximately 16-34 tests
    - Verify all critical egg production workflows pass
    - Do NOT run entire application test suite
    - Document any gaps or known issues
  - [ ] 5.5 Verify data isolation in integration tests
    - Test that user A cannot see or modify user B's entries
    - Test that DELETE cascades properly when user is deleted
    - Verify monthly aggregation only includes user's own data

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 16-34 tests)
- Critical user workflows covered: add -> view -> edit -> delete
- Data isolation verified: users can only access their own data
- No more than 10 additional tests added in 5.3
- Monthly aggregation calculations verified correct

## Execution Order

**Recommended implementation sequence:**

1. **Database Layer (Task Group 1)** - 7 sub-tasks
   - Create validation schema, types, Prisma model, and migration
   - Write and verify database tests
   - Foundation for all API work

2. **API Layer (Task Group 2)** - 8 sub-tasks
   - Implement 5 endpoints (POST, GET, PUT, DELETE, monthly)
   - Add error handling and validation
   - Write and verify API tests
   - Ready for frontend consumption

3. **Validation & Error Handling (Task Group 4)** - 4 sub-tasks
   - Verify client/server validation parity
   - Ensure consistent error formats
   - Can be done in parallel with UI work after API is complete

4. **Frontend Components (Task Group 3)** - 10 sub-tasks
   - Build UI components: calendar, table, dialog
   - Integrate with API endpoints
   - Add responsive design and interactions
   - Write and verify component tests

5. **Testing & Integration (Task Group 5)** - 5 sub-tasks
   - Review and analyze test coverage
   - Write integration tests for end-to-end workflows
   - Final verification of all critical paths
   - Optional: can start after Task Group 3 is substantially complete

## Key Dependencies and Relationships

- **Database first**: EggProduction model must exist before API can be built
- **API before UI**: Endpoints must be working before components can consume them
- **Validation at all layers**: Schema drives both API validation and client-side form validation
- **Tests throughout**: Each task group includes focused tests before final verification
- **Integration last**: End-to-end tests verify all layers work together correctly

## Tech Stack and Patterns Reference

- **Database**: Prisma ORM, PostgreSQL
- **API**: Next.js API routes (app/api), NextAuth.js for authentication
- **Validation**: Zod schemas (client and server)
- **Frontend**: React, Next.js, React Hook Form, existing UI component library
- **Testing**: Jest, Vitest, or existing test runner
- **Styling**: Tailwind CSS with existing design system

## File Structure Summary

```
app/
  api/
    egg-production/
      route.ts                 # POST, GET endpoints
      monthly/
        route.ts              # GET /api/egg-production/monthly
      [id]/
        route.ts              # PUT, DELETE endpoints
  egg-production/
    page.tsx                  # Main page component

components/
  egg-production-calendar.tsx      # Calendar view
  monthly-aggregate-table.tsx      # 6-month summary table
  add-edit-egg-production-dialog.tsx  # Form dialog
  egg-production-client.tsx        # Client-side manager

lib/
  validations/
    egg-production.ts         # Zod schema
  types/
    egg-production.ts         # TypeScript interfaces

prisma/
  schema.prisma               # Add EggProduction model
  migrations/
    [timestamp]_add_egg_production/
      migration.sql           # Database migration

__tests__/
  api/
    egg-production.test.ts    # API endpoint tests
  components/
    egg-production-calendar.test.tsx
    add-edit-egg-production-dialog.test.tsx
  integration/
    egg-production-workflow.test.ts  # End-to-end tests
```
