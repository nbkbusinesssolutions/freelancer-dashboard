# NBK Control Center

## Overview
Internal control center for NBK Business Solutions to manage client projects, invoices, email accounts, and AI subscriptions. Built with React, TypeScript, and Tailwind CSS.

## Current State (Production Ready)
- Full-stack application with Vite frontend
- LocalStorage for data persistence with export/import backup
- Dashboard with KPI cards, attention panels, financial snapshot, and action items
- Projects management with payment tracking and countdown alerts
- Professional Invoicing with line items, tax, discounts, and branded preview
- AI Subscriptions management with expiry tracking
- Unified Email Accounts module with tags and bulk add
- Business Branding configuration (logo, UPI QR, contact details)
- Client dossier pages for quick client overview
- Search functionality on all major pages

## Deployment (Netlify)
- `netlify.toml` configured for SPA routing
- `public/_redirects` as fallback
- Build command: `npm run build`
- Publish directory: `dist`

## Recent Changes (2026-01-27)

### Project Detail Page Redesign:
- **Comprehensive Layout**: All project fields now displayed in organized card sections
- **Clear Sections**: Basic Information, Domain Information, Hosting Information, Payment & Status
- **All Dates Visible**: Domain purchase date, renewal date, hosting start date, renewal date with countdowns
- **Payment Summary**: Project amount, payment status, pending amount, completed date
- **Edit Button**: Quick access to edit project directly from detail view
- **INR Currency**: All amounts displayed in ₹ (Indian Rupees) with locale formatting

### Financial Snapshot Improvements:
- **Show/Hide Toggle**: Eye icon button to mask/unmask financial amounts
- **Privacy Feature**: Remembers preference in localStorage
- **INR Currency**: Revenue displayed in ₹ format

### Module Consolidation:
- **Unified Email Accounts**: Merged Account Vault and Email Accounts into a single module
- **Email Tags**: Added tags field for categorization (Domain, Hosting, Admin, etc.)
- **Bulk Add Feature**: Paste multiple emails at once with CSV/text support

### Professional Invoicing:
- **Invoice System**: Replaced basic Billing with full invoicing (line items, tax, discounts)
- **Invoice Preview**: Print-ready layout with business branding
- **UPI Payment**: QR code integration for payment collection
- **Business Branding**: Configure logo, company details, UPI ID in Settings

### Removed Modules:
- **Services Catalog**: Removed entirely (simplified workflow)
- **Account Vault**: Merged into Email Accounts

### Route Updates:
- `/services` → `/invoices` (new invoicing system)
- `/account-vault` removed (use `/email-accounts`)

### Previous Features:
- **Username Fields**: Domain username and deployment username in projects
- **Same as Domain Checkbox**: Auto-copy domain dates to hosting dates
- **Edit Functionality**: Projects fully editable after creation

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
- `nbk.emailAccounts` - Email account credentials
- `nbk.invoices` - Invoice records
- `nbk.businessBranding` - Company branding config

## Key Files
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/Projects.tsx` - Projects list with create/edit modal
- `src/pages/ProjectDetail.tsx` - Unified project view
- `src/pages/ClientDetail.tsx` - Client dossier
- `src/pages/Invoices.tsx` - Invoice management
- `src/pages/EmailAccounts.tsx` - Unified email credentials management
- `src/pages/Settings.tsx` - Data backup, API config, Business Branding
- `src/hooks/useInvoices.ts` - Invoice data hook
- `src/hooks/useEmailAccounts.ts` - Email accounts hook
- `src/hooks/useBusinessBranding.ts` - Business branding hook
- `src/components/invoices/InvoicePreview.tsx` - Print-ready invoice view
- `src/components/email-accounts/EmailCombobox.tsx` - Email selector component
- `src/lib/types.ts` - Type definitions
- `src/index.css` - NBK brand color palette

## Routes
- `/` - Dashboard
- `/projects` - Projects list
- `/projects/:projectId` - Project detail
- `/clients/:clientId` - Client dossier
- `/invoices` - Invoice management
- `/ai-subscriptions` - AI Subscriptions
- `/email-accounts` - Email Accounts
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

## Invoice Fields
- Invoice Number (auto-generated)
- Client Name, Project Name
- Invoice Date, Due Date
- Line Items (description, quantity, rate, amount)
- Tax Rate, Discount
- Subtotal, Total
- Payment Status (Pending, Partial, Paid, Overdue)
- Paid Amount, Notes

## Email Account Fields
- Email address
- Password (masked)
- Provider (Gmail, Namecheap, GoDaddy, etc.)
- Status (Active, Not in use)
- Tags (Domain, Hosting, Admin, Client, etc.)
- Notes

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
