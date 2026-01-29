# NBK Control Center

## Overview
Internal control center for NBK Business Solutions - manage projects, domain renewals, AI subscriptions, invoices, and email accounts.

## Technology Stack
- **Frontend**: React 18 with Vite, TailwindCSS, Radix UI components
- **Backend**: Express.js with Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **PWA**: Enabled via vite-plugin-pwa

## Project Structure
```
src/                    # React frontend
  components/           # UI components
  hooks/                # Custom React hooks
  lib/                  # Utilities and API client
  pages/                # Page components
server/                 # Express backend
  db.ts                 # Database connection
  index.ts              # Server entry point
  routes.ts             # API routes
shared/                 # Shared code
  schema.ts             # Drizzle schema definitions
public/                 # Static assets
```

## Scripts
- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes

## API Endpoints
All API routes are prefixed with `/api`:
- `/api/clients` - Clients CRUD
- `/api/projects` - Projects CRUD
- `/api/invoices` - Invoices with line items CRUD
- `/api/email-accounts` - Email accounts CRUD
- `/api/ai-subscriptions` - AI subscriptions CRUD
- `/api/actions` - Action items CRUD
- `/api/project-logs` - Project logs CRUD
- `/api/branding` - Business branding GET/PUT

## Database Schema
Tables: clients, email_accounts, projects, invoices, invoice_items, ai_subscriptions, action_items, project_logs, business_branding

## Recent Changes
- 2026-01-29: Migrated from Supabase to Replit PostgreSQL with Drizzle ORM
- 2026-01-29: Converted Netlify serverless functions to Express routes
