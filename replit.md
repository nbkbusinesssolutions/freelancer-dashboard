# NBK Control Center v2.0

## Overview
Internal control center for NBK Business Solutions - manage projects, domain renewals, AI subscriptions, invoices, and email accounts. Now powered by **Neon PostgreSQL** via Netlify Functions for cloud database sync across all devices.

## Technology Stack
- **Frontend**: React 18 with Vite, TailwindCSS, Radix UI components
- **Backend**: Netlify Functions (serverless)
- **Database**: Neon PostgreSQL
- **Deployment**: Netlify
- **PWA**: Enabled via vite-plugin-pwa

## v2.0 Intelligence Features
- **Urgency Score System**: Weighted priorities (overdue invoices: 1000, pending: 500, renewals: 300, AI subs: 150, actions: 250)
- **Command Center Dashboard**: "One Thing" priority card, Financial Vitals bar, "All Clear" calm state
- **Effort Logging & Profitability**: Track hours worked, calculate project margins with color-coded indicators
- **Invoice Reminders**: "Send Reminder" feature with customizable email templates
- **AI Spend Summary**: Total monthly spend tracking with "View by Cost" sorting

## Setup Instructions

### 1. Create Neon Database
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Go to **Dashboard** → **Connection Details**
4. Copy the **Connection string** (starts with `postgresql://`)

### 2. Create Database Tables
1. In your Neon dashboard, go to **SQL Editor**
2. Copy the contents of `neon-schema.sql` from this project
3. Run the SQL to create all tables

### 3. Deploy to Netlify
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) and import your repository
3. Before deploying, add environment variable:
   - `DATABASE_URL` = your Neon connection string
4. Deploy!

## Project Structure
```
src/                    # React frontend
  components/           # UI components
    dashboard/          # Command Center components
    effort-log/         # Effort logging components
    project/            # Profitability display
    invoices/           # Invoice reminder modal
    ai-subscriptions/   # AI spend summary
  hooks/                # React hooks (API integration)
  lib/                  # Utilities
    api.ts              # API client for Netlify functions
    urgencyScore.ts     # Urgency calculation system
  pages/                # Page components
netlify/functions/      # Serverless API endpoints
public/                 # Static assets
neon-schema.sql         # Database schema (run in Neon SQL Editor)
```

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production

## Database Schema (Neon PostgreSQL)
Tables: clients, email_accounts, projects, invoices, invoice_items, ai_subscriptions, action_items, project_logs, business_branding, effort_logs

## API Endpoints (Netlify Functions)
- `/api/clients` - CRUD for clients
- `/api/projects` - CRUD for projects
- `/api/invoices` - CRUD for invoices with line items
- `/api/email-accounts` - CRUD for email accounts
- `/api/ai-subscriptions` - CRUD for AI subscriptions
- `/api/action-items` - CRUD for action items
- `/api/project-logs` - Project activity logs
- `/api/effort-logs` - Time tracking
- `/api/branding` - Business branding settings

## Recent Changes
- 2026-02-03: Migrated to Neon + Netlify Functions architecture
- 2026-02-03: v2.0 Upgrade - Intelligence Layer with urgency scoring, Command Center, effort tracking, profitability
