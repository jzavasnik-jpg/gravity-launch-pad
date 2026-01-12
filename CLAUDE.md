# Launch Pad by Gravity

AI-powered market validation and product launch platform.

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

**Framework:** Next.js 16 with App Router
**Auth:** Supabase Auth
**Database:** Supabase (PostgreSQL)
**Storage:** Backblaze B2 (S3-compatible)
**Styling:** Tailwind CSS + shadcn/ui
**State:** Zustand + React Context

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public SSR pages (SEO)
│   ├── (protected)/        # Authenticated CSR pages
│   ├── api/                # API routes
│   └── auth/               # Auth callbacks
├── components/             # React components
│   └── ui/                 # shadcn/ui components
├── context/                # React contexts
├── hooks/                  # Custom hooks
├── lib/                    # Utilities and services
├── store/                  # Zustand stores
└── types/                  # TypeScript types
```

## Key Files

- `src/lib/supabase.ts` - Supabase client and auth helpers
- `src/lib/auth-service.ts` - Authentication functions
- `src/lib/database-service.ts` - Database operations
- `src/lib/storage-service.ts` - Backblaze B2 file uploads
- `src/context/AuthContext.tsx` - Auth state provider
- `src/components/AppLayout.tsx` - Main app layout with sidebar

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `B2_KEY_ID` - Backblaze B2 key ID
- `B2_APPLICATION_KEY` - Backblaze B2 application key
- `NEXT_PUBLIC_B2_BUCKET_NAME` - B2 bucket name

## Brand Guidelines

- **Primary Color:** Cyan (#4FD1FF)
- **Font (Headings):** Inter (font-display)
- **Font (Body):** Inter
- **Font (Mono):** JetBrains Mono
- **Style:** Dark mode first, floating card effects

## Routes

### Public (SSR for SEO)
- `/` - Landing page
- `/pricing` - Pricing page

### Protected (CSR, requires auth)
- `/dashboard` - User dashboard
- `/icp` - ICP interview flow
- `/icp/review` - Review avatars
- `/veritas/*` - Content creation workflow
- `/landing-pad/*` - Landing page generator

## Development Notes

- All lib files use `'use client'` directive
- TypeScript errors are ignored during build (fix incrementally)
- CORS headers configured for CTO Command Center preview
