# ChickenTracker

A personal farm management web application for tracking backyard chicken flocks.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5 (Auth.js)
- **Forms:** React Hook Form with Zod validation
- **UI:** Tailwind CSS with shadcn/ui components
- **Package Manager:** npm

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- npm (comes with Node.js)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your configuration:
   - Set `DATABASE_URL` with your PostgreSQL connection string
   - Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
   - Update `NEXTAUTH_URL` if not using localhost:3000

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Seed the database with initial user accounts:
   ```bash
   npx tsx prisma/seed.ts
   ```
   This creates two user accounts:
   - `user1@example.com` with password `password123`
   - `user2@example.com` with password `password456`

7. Run the development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Seeding

The seed script (`prisma/seed.ts`) creates two user accounts with hashed passwords. The script is idempotent and can be run multiple times safely.

### Running the Seed Script

```bash
npx tsx prisma/seed.ts
```

### Updating User Credentials

To update user emails or passwords:

1. Edit the user data in `prisma/seed.ts`
2. Re-run the seed script: `npx tsx prisma/seed.ts`

The script uses upsert operations, so existing users will be updated with new values.

### Manually Resetting Passwords

To generate a new password hash:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash));"
```

Then update the password field directly in the database or in the seed script.

## Project Structure

```
chickentracker/
├── app/                # Next.js App Router pages and layouts
│   ├── globals.css    # Global styles with Tailwind directives
│   ├── layout.tsx     # Root layout component
│   └── page.tsx       # Home page
├── components/        # React components
│   └── ui/           # shadcn/ui components
├── lib/              # Utility functions and configurations
│   ├── validations/  # Zod validation schemas
│   └── utils.ts      # Utility functions
├── prisma/           # Database schema and migrations
│   ├── schema.prisma # Database schema
│   ├── migrations/   # Migration files
│   └── seed.ts       # Database seed script
├── .env.local        # Local environment variables (not in git)
└── .env.example      # Example environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Database Scripts

- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma Client
- `npx tsx prisma/seed.ts` - Seed database with initial data
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Environment Variables

See `.env.example` for required environment variables and documentation.

## License

Private project for personal use.
