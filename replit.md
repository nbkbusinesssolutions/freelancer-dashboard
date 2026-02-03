# NBK Control Center v2.0

## Overview
Internal control center for NBK Business Solutions - manage projects, domain renewals, AI subscriptions, invoices, and email accounts. Now powered by **Supabase** for cloud database sync across all devices.

## Technology Stack
- **Frontend**: React 18 with Vite, TailwindCSS, Radix UI components
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (static site)
- **PWA**: Enabled via vite-plugin-pwa

## v2.0 Intelligence Features
- **Urgency Score System**: Weighted priorities (overdue invoices: 1000, pending: 500, renewals: 300, AI subs: 150, actions: 250)
- **Command Center Dashboard**: "One Thing" priority card, Financial Vitals bar, "All Clear" calm state
- **Effort Logging & Profitability**: Track hours worked, calculate project margins with color-coded indicators
- **Invoice Reminders**: "Send Reminder" feature with customizable email templates
- **AI Spend Summary**: Total monthly spend tracking with "View by Cost" sorting

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key

### 2. Create Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from this project
3. Run the SQL to create all tables

### 3. Configure Environment Variables

**For Local Development:**
Create a `.env` file:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**For Vercel Deployment:**
Add these as environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. Deploy to Vercel
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard
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
  hooks/                # React hooks (Supabase integration)
  lib/                  # Utilities
    supabase.ts         # Supabase client
    urgencyScore.ts     # Urgency calculation system
  pages/                # Page components
public/                 # Static assets
supabase-schema.sql     # Database schema (run in Supabase SQL Editor)
```

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production

## Database Schema (Supabase)
Tables: clients, email_accounts, projects, invoices, invoice_items, ai_subscriptions, action_items, project_logs, business_branding, effort_logs

## Recent Changes
- 2026-02-03: Migrated from Replit PostgreSQL to Supabase for cloud sync
- 2026-02-03: v2.0 Upgrade - Intelligence Layer with urgency scoring, Command Center, effort tracking, profitability
- 2026-02-03: Removed Express backend - now pure frontend with Supabase direct connection
