# Freelancer Control Center Dashboard

## Overview
A comprehensive dashboard for freelancers to manage client projects, services, renewals, and billing. Built with React, Express, and Supabase.

## Current State
- Full-stack application with Vite frontend and Express backend
- Supabase database integration for data persistence (requires SUPABASE_URL and SUPABASE_SERVICE_KEY)
- Dashboard with KPI cards, attention panels, and renewal tracking
- Projects management with payment tracking and countdown alerts
- AI Subscriptions management with expiry tracking
- Account Vault for credential management

## Recent Changes (2026-01-27)
### Phase 1 Features Implemented:
- **Data Models**: ActionItem, AttentionState, ProjectLogEntry types added
- **Unified Project Detail Page**: `/projects/:projectId` shows all project info, linked accounts, AI subscriptions, billing, action items, and project log
- **Action Items System**: Contextual tasks tied to projects or clients with due dates
- **Attention State**: Manual override system (Stable, Review Soon, Action Required, At Risk) for projects and AI subscriptions
- **Client Dossier**: `/clients/:clientId` shows all projects, billing summary, and action items for a client
- **Financial Snapshot**: Dashboard section showing revenue this month and upcoming renewals
- **Project Log**: Append-only chronological log for each project

### Previous Changes:
- Added payment tracking fields to Projects: projectAmount, paymentStatus, completedDate, pendingAmount
- Enhanced ProjectsList with countdown badges (15/30 days alerts for renewals)
- Added payment status badges with color coding
- Updated Dashboard to display pending payments section and KPI card

## Architecture

### Frontend (port 5000)
- React with Vite
- TanStack Query for data fetching
- Shadcn/UI components
- React Router for navigation

### Backend (port 3000)
- Express.js server
- Supabase client for database operations
- RESTful API endpoints
- Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY environment variables

### Database (Supabase)
Tables:
- account_vault: Email/credential storage
- projects: Client project management
- ai_subscriptions: AI tool subscription tracking

### Local Storage
- `nbk.actions`: Action items storage
- `nbk.projectLogs`: Project log entries

## Key Files
- `src/pages/Dashboard.tsx` - Main dashboard with KPIs, attention panel, financial snapshot, action items
- `src/pages/ProjectDetail.tsx` - Unified project detail page
- `src/pages/ClientDetail.tsx` - Client dossier page
- `src/pages/Projects.tsx` - Projects CRUD with payment tracking form
- `src/components/actions/ActionItemsSection.tsx` - Action items component
- `src/components/project-log/ProjectLogSection.tsx` - Project log component
- `src/components/attention/AttentionStateSelector.tsx` - Attention state dropdown
- `src/components/financial/FinancialSnapshot.tsx` - Financial overview component
- `src/hooks/use-actions.ts` - Action items hook (localStorage)
- `src/hooks/use-project-log.ts` - Project log hook (localStorage)
- `src/lib/types.ts` - TypeScript type definitions
- `server/index.js` - Express backend with Supabase integration

## Routes
- `/` - Dashboard
- `/projects` - Projects list
- `/projects/:projectId` - Project detail page
- `/clients/:clientId` - Client dossier page
- `/services` - Services & Billing
- `/ai-subscriptions` - AI Subscriptions
- `/account-vault` - Account Vault
- `/settings` - Settings

## User Preferences
- Show dates prominently with countdown alerts (15/30 days left)
- Track payment status even after project completion
- Display completion date and amounts clearly
- Use color-coded badges for status indicators
- Attention states for manual override of automated alerts
