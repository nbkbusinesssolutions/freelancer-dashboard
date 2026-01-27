# Freelancer Control Center Dashboard

## Overview
A comprehensive dashboard for freelancers to manage client projects, services, renewals, and billing. Built with React, Express, and Supabase.

## Current State
- Full-stack application with Vite frontend and Express backend
- Supabase database integration for data persistence
- Dashboard with KPI cards, attention panels, and renewal tracking
- Projects management with payment tracking and countdown alerts
- AI Subscriptions management with expiry tracking
- Account Vault for credential management

## Recent Changes (2026-01-27)
- Added payment tracking fields to Projects: projectAmount, paymentStatus, completedDate, pendingAmount
- Enhanced ProjectsList with countdown badges (15/30 days alerts for renewals)
- Added payment status badges with color coding
- Updated Dashboard to display pending payments section and KPI card
- Added Projects filtering support for ?payment=pending query parameter

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

### Database (Supabase)
Tables:
- account_vault: Email/credential storage
- projects: Client project management
- ai_subscriptions: AI tool subscription tracking

## Key Files
- `src/pages/Dashboard.tsx` - Main dashboard with KPIs and attention panel
- `src/pages/Projects.tsx` - Projects CRUD with payment tracking form
- `src/components/projects/ProjectsList.tsx` - Projects table with countdown badges
- `src/components/dashboard/DashboardAttentionPanel.tsx` - Renewals and pending payments
- `src/lib/types.ts` - TypeScript type definitions
- `server/index.js` - Express backend with Supabase integration

## User Preferences
- Show dates prominently with countdown alerts (15/30 days left)
- Track payment status even after project completion
- Display completion date and amounts clearly
- Use color-coded badges for status indicators
