# NBK Control Center v2.0

## Overview
Internal control center for NBK Business Solutions - manage projects, domain renewals, AI subscriptions, invoices, and email accounts. v2.0 transforms the app from a passive data viewer into an active "Co-Pilot" with intelligent priority scoring and proactive business insights.

## Technology Stack
- **Frontend**: React 18 with Vite, TailwindCSS, Radix UI components
- **Backend**: Express.js with Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **PWA**: Enabled via vite-plugin-pwa

## v2.0 Intelligence Features
- **Urgency Score System**: Weighted priorities (overdue invoices: 1000, pending: 500, renewals: 300, AI subs: 150, actions: 250)
- **Command Center Dashboard**: "One Thing" priority card, Financial Vitals bar, "All Clear" calm state
- **Effort Logging & Profitability**: Track hours worked, calculate project margins with color-coded indicators
- **Invoice Reminders**: "Send Reminder" feature with customizable email templates
- **AI Spend Summary**: Total monthly spend tracking with "View by Cost" sorting

## Project Structure
```
src/                    # React frontend
  components/           # UI components
    dashboard/          # Command Center components (OneThingCard, FinancialVitals, AllClearCard)
    effort-log/         # Effort logging components
    project/            # Profitability display
    invoices/           # Invoice reminder modal
    ai-subscriptions/   # AI spend summary
  hooks/                # Custom React hooks
  lib/                  # Utilities and API client
    urgencyScore.ts     # Urgency calculation system
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
- `/api/branding` - Business branding GET/PUT (includes defaultHourlyRate)
- `/api/effort-logs` - Effort time tracking CRUD

## Database Schema
Tables: clients, email_accounts, projects, invoices, invoice_items, ai_subscriptions, action_items, project_logs, business_branding, effort_logs

## Recent Changes
- 2026-02-03: v2.0 Upgrade - Intelligence Layer with urgency scoring, Command Center, effort tracking, profitability
- 2026-02-03: Added AI Spend Summary and "View by Cost" sorting to AI Subscriptions
- 2026-02-03: Added "Send Reminder" feature for invoices with email templates
- 2026-02-03: Added effort logging and default hourly rate for profitability calculations
- 2026-01-29: Migrated from Supabase to Replit PostgreSQL with Drizzle ORM
- 2026-01-29: Converted Netlify serverless functions to Express routes
