# NBK Control Center

## Overview
Internal control center for NBK Business Solutions to manage client projects, services, renewals, and billing. Built with React, TypeScript, and Tailwind CSS.

## Current State (Production Ready)
- Full-stack application with Vite frontend
- LocalStorage for data persistence with export/import backup
- Dashboard with KPI cards, attention panels, financial snapshot, and action items
- Projects management with payment tracking and countdown alerts
- AI Subscriptions management with expiry tracking
- Account Vault for credential management
- Client dossier pages for quick client overview

## Deployment (Netlify)
- `netlify.toml` configured for SPA routing
- `public/_redirects` as fallback
- Build command: `npm run build`
- Publish directory: `dist`

## Recent Changes (2026-01-27)
### Production Readiness:
- Added Netlify routing config (netlify.toml + _redirects)
- Added data export/import in Settings for backup
- Updated branding to "NBK Control Center"
- Applied NBK brand color palette (navy + gold)
- Cleaned up API indicator (shows "Local" or "Synced")

### Phase 1 Features:
- Unified Project Detail Page with all project info
- Action Items System (contextual tasks)
- Attention State manual override system
- Client Dossier pages
- Financial Snapshot on Dashboard
- Project Log for chronological notes

## Architecture

### Frontend (port 5000)
- React 18 with Vite
- TanStack Query for data fetching
- Shadcn/UI + Radix components
- React Router for navigation
- Tailwind CSS with custom NBK color palette

### Data Storage
- LocalStorage by default (no server required)
- Optional external REST API support
- Export/import JSON for backups

### Local Storage Keys
- `nbk.actions` - Action items
- `nbk.projectLogs` - Project log entries
- `nbk.masterList.servicesCatalog` - Services catalog
- `nbk.masterList.billingLog` - Billing log

## Key Files
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/ProjectDetail.tsx` - Unified project view
- `src/pages/ClientDetail.tsx` - Client dossier
- `src/pages/Settings.tsx` - Data backup & API config
- `src/components/actions/ActionItemsSection.tsx` - Action items
- `src/components/financial/FinancialSnapshot.tsx` - Financial overview
- `src/index.css` - NBK brand color palette

## Routes
- `/` - Dashboard
- `/projects` - Projects list
- `/projects/:projectId` - Project detail
- `/clients/:clientId` - Client dossier
- `/services` - Services & Billing
- `/ai-subscriptions` - AI Subscriptions
- `/account-vault` - Account Vault
- `/settings` - Settings & Backup

## Brand Colors
- Primary (Navy): `hsl(215, 50%, 23%)`
- Accent (Gold): `hsl(43, 96%, 56%)`
- Background: Warm off-white

## TODO Before Launch
1. Add actual NBK logo images to public folder:
   - `logo-icon.png` (64x64) - Sidebar icon
   - `logo-192.png` (192x192) - PWA icon
   - `logo-512.png` (512x512) - PWA icon
2. Set `VITE_API_BASE_URL` in Netlify if using external API

## User Preferences
- Show dates prominently with countdown alerts
- Track payment status even after project completion
- Use color-coded badges for status indicators
- Attention states for manual override of automated alerts
- Calm, professional UI (no flashy colors)
