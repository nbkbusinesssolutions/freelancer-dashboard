# NBK Control Center

## Overview
Internal control center for NBK Business Solutions to manage client projects, billing, email accounts, and AI subscriptions. Built with React, TypeScript, and Tailwind CSS.

## Current State (Production Ready)
- Full-stack application with Vite frontend
- LocalStorage for data persistence with export/import backup
- Dashboard with KPI cards, attention panels, financial snapshot, and action items
- Projects management with payment tracking and countdown alerts
- AI Subscriptions management with expiry tracking
- Email Accounts management for storing email credentials securely
- Account Vault for credential management
- Client dossier pages for quick client overview
- Search functionality on all major pages

## Deployment (Netlify)
- `netlify.toml` configured for SPA routing
- `public/_redirects` as fallback
- Build command: `npm run build`
- Publish directory: `dist`

## Recent Changes (2026-01-27)
### Project Form Improvements:
- **Username Fields**: Added domain username and deployment username fields to project form
- **Same as Domain Checkbox**: Auto-copy domain dates to hosting dates when checked
- **Project Status**: Updated options to "Ongoing", "Completed", "On Hold"
- **Edit Functionality**: Projects are now fully editable after creation with Edit button
- **ProjectDetail View**: Shows usernames in the Project Overview section

### Previous Features:
- **Search Everywhere**: Added search to Projects, AI Subscriptions, Billing, and Email Accounts pages
- **Email Accounts Module**: New dedicated page for managing email credentials with password masking
- **Simplified Billing**: Removed Service Catalog, focused on billing records only
- **Reusable SearchInput**: Created `SearchInput` component for consistent search UI

### Production Readiness:
- Added Netlify routing config (netlify.toml + _redirects)
- Added data export/import in Settings for backup
- Updated branding to "NBK Control Center"
- Applied NBK brand color palette (navy + gold)
- Cleaned up API indicator (shows "Local" or "Synced")

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
- `nbk.masterList.billingLog` - Billing records
- `nbk.emailAccounts` - Email account credentials

## Key Files
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/Projects.tsx` - Projects list with create/edit modal
- `src/pages/ProjectDetail.tsx` - Unified project view
- `src/pages/ClientDetail.tsx` - Client dossier
- `src/pages/Billing.tsx` - Billing records
- `src/pages/EmailAccounts.tsx` - Email credentials management
- `src/pages/Settings.tsx` - Data backup & API config
- `src/components/ui/search-input.tsx` - Reusable search component
- `src/components/projects/ProjectsList.tsx` - Projects table/cards with edit/delete
- `src/lib/types.ts` - Type definitions including ProjectItem
- `src/index.css` - NBK brand color palette

## Routes
- `/` - Dashboard
- `/projects` - Projects list
- `/projects/:projectId` - Project detail
- `/clients/:clientId` - Client dossier
- `/services` - Billing records
- `/ai-subscriptions` - AI Subscriptions
- `/email-accounts` - Email Accounts
- `/account-vault` - Account Vault
- `/settings` - Settings & Backup

## Brand Colors
- Primary (Navy): `hsl(215, 50%, 23%)`
- Accent (Gold): `hsl(43, 96%, 56%)`
- Background: Warm off-white

## Project Fields
- Client Name, Project Name, Domain Name
- Domain Provider (Namecheap, GoDaddy, Other)
- Domain Account Email, Domain Username
- Deployment Email, Deployment Username
- Hosting Platform (default: Netlify)
- Domain Purchase Date, Domain Renewal Date
- Hosting Start Date, Hosting Renewal Date (with "Same as Domain" option)
- Project Status: Ongoing, Completed, On Hold
- Project Amount, Payment Status, Pending Amount
- Completed Date, Notes

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
- Search functionality on all data pages
- Edit functionality for all data entries
