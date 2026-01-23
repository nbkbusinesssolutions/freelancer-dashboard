
<context>
Goal: Make NBK Business Dashboard feel “highly professional”, solve real workflow problems, and work perfectly on mobile—without backend changes (stays at the current API boundary and remains Netlify-ready).

Current state (key findings from code):
- Layout: `AppShell` already uses a responsive sidebar + sticky header and padding (`p-4 md:p-6`).
- Biggest mobile pain: all main pages rely on dense tables (`Table` is horizontally scrollable, but still not “mobile-first”). Forms open in centered Dialogs which can feel cramped on phones.
- There’s still a legacy `src/App.css` that looks like a Vite template. It is not currently imported by `main.tsx`, but we should verify no imports exist and keep the project clean.
- You already have: `useIsMobile()` hook and a `Drawer` component (Vaul) available—perfect for mobile-first edit/create flows.

Plan focuses on: (1) a mobile-first layout pattern across all pages, (2) professional UI consistency, (3) workflow upgrades (drawers, quick actions), (4) safe Netlify SPA hardening.
</context>

<success-criteria>
Mobile:
- No “pinch/zoom” required for core actions.
- Tables become readable “cards” on small screens with clear primary actions.
- Create/Edit actions are comfortable on phones (bottom drawer, sticky action buttons).
- Header + sidebar are usable; content spacing and typography are consistent.

Professional polish:
- Consistent headings, spacing, empty states, loading states.
- Clear hierarchy and “scan-friendly” layouts (freelancer ops cockpit vibe).
- Buttons, badges, and forms feel cohesive and predictable.
</success-criteria>

<phase-1_foundation_layout_and_design_system (highest-impact, low-risk)>
1) Global layout cleanup and responsiveness baseline
- Audit and remove/stop using any leftover template constraints:
  - Confirm `App.css` is not imported; if unused, delete or keep but ensure it never affects layout.
- Ensure the app uses full-width on all devices:
  - Verify `index.html`/root wrappers don’t constrain width.
  - Ensure `AppShell` main container remains `w-full` and doesn’t get overridden.
- Add a small “design system layer” for consistent typography + spacing:
  - Standardize page header pattern: `h1`, subtext, and right-side actions.
  - Introduce consistent section spacing (`space-y-6` is already used—keep that standard).

2) Make header actions mobile-safe
- In `AppShell` header:
  - Ensure the title truncates nicely (already `truncate`).
  - Ensure the API button remains accessible (already hides “API” label on small screens).
  - Consider moving some “secondary” actions into an overflow menu on mobile if needed later.

Deliverable: the app feels less “template”, more “product”, and sets the baseline for responsive components.
</phase-1_foundation_layout_and_design_system>

<phase-2_mobile_first_data_display_tables_to_cards>
This is the core mobile responsiveness upgrade.

Pattern (recommended):
- On mobile (<md): replace table rows with stacked “Record Cards”.
- On desktop (md+): keep tables for fast scanning and density.

Implementation approach:
- Create a reusable `ResponsiveList` pattern (component or page-local) that renders:
  - `Table` for md+ (existing table remains mostly unchanged).
  - `Card` list for mobile, each card shows:
    - Primary identifier (bold): email / project name / tool name
    - Key metadata lines: platform/status, domain, cancel-by, etc.
    - Actions as large tap targets (edit/delete) aligned consistently.

Apply to:
1) Account Vault (`/account-vault`)
- Mobile cards show:
  - Email (primary)
  - Platform (secondary)
  - Active/Inactive badge
  - Edit + Delete buttons (larger, not tiny icon-only on mobile)
- Keep search input and “Bulk Add” + “Add Email” actions accessible on mobile (possibly stack vertically with full-width buttons on very small screens).

2) Projects (`/projects`)
- Mobile cards show:
  - ProjectName + ClientName
  - DomainName
  - Status badge
  - Quick actions: View/Edit (drawer) and Delete
- Keep filter status in URL (already exists) and make it easy to apply via a filter UI later.

3) AI Subscriptions (`/ai-subscriptions`)
- Mobile cards show:
  - ToolName + subscription type
  - Status badge
  - Cancel-by date
  - Delete action + “Open details” (drawer) once added in later phases

Deliverable: On phones, the app reads like a modern mobile product, not a desktop table squeezed into a small screen.
</phase-2_mobile_first_data_display_tables_to_cards>

<phase-3_mobile_first_forms_dialog_to_drawer>
Goal: every create/edit flow is comfortable on mobile.

Pattern:
- Desktop (md+): keep current Dialog (centered modal) for speed.
- Mobile: use bottom `Drawer` with:
  - Scrollable content
  - Sticky footer actions (Cancel/Save)
  - Full-width inputs and larger spacing

Implementation approach:
- Create a reusable “ResponsiveModal” wrapper:
  - Uses `useIsMobile()` to render either `Dialog` or `Drawer`.
  - Exposes a consistent API: `open`, `onOpenChange`, `title`, `description`, `children`, and `footer`.
- Refactor these flows to use it:
  1) AccountVaultUpsertDialog (Add/Edit email)
  2) AccountVaultBulkAddDialog (Bulk add)
  3) Projects create/edit (currently only create in a Dialog)
  4) AI Subscriptions add/edit (currently only add in a Dialog)

Deliverable: Forms no longer feel cramped on mobile; user can reliably add/edit records on the go.
</phase-3_mobile_first_forms_dialog_to_drawer>

<phase-4_projects_workflow_upgrade_drawer_edit_details (your chosen UX)>
Goal: “freelancer-grade” Projects workflow while staying frontend-only.

1) Add “Edit” action to Projects list
- Add an edit button per project row/card.
- Open a Projects Drawer (mobile + desktop) to edit:
  - Client name, project name, domain, providers, emails, dates, status, notes.
- Reuse the existing validation schema and `useUpsertProject()` mutation.

2) Add “Details” view in drawer
- Without leaving the list, show a read-only details layout:
  - Domain provider, domain email, deployment email, key dates, status, notes.
- From details view, include a prominent “Edit” button.

3) Filters and search (mobile-friendly)
- Add a search input (client/project/domain).
- Add filter chips for Status on mobile; keep URL query params so filtering is shareable/bookmarkable.

Deliverable: Projects becomes a workflow tool, not a static list.
</phase-4_projects_workflow_upgrade_drawer_edit_details>

<phase-5_dashboard_and_visual_polish>
1) Dashboard “ops cockpit” layout (mobile-first)
- Keep existing structure but enhance:
  - Quick actions row (New Project / Add Subscription / Add Vault Email)
  - “Attention” section cards (Expired/Expiring soon counts already exist)
  - Mobile spacing + typography tuning

2) Professional polish checklist across pages
- Empty states:
  - Replace “No X yet” with short actionable guidance + a button (e.g., “Add your first email”).
- Loading states:
  - Use skeletons in tables/cards while fetching (you already have a `skeleton` component).
- Consistent badge colors and meaning:
  - Keep the operational status logic (Expiring Soon/Expired) and ensure consistent variants on all pages.
- Micro-interactions:
  - Subtle hover/tap feedback; keep animations minimal and purposeful.

Deliverable: The app looks intentional, not assembled—higher trust and better usability.
</phase-5_dashboard_and_visual_polish>

<phase-6_netlify_deployment_hardening_frontend_only>
Goal: “Netlify-ready” SPA routing and predictable configuration.

- Add Netlify SPA redirect:
  - Either `public/_redirects` with: `/* /index.html 200`
  - Or `netlify.toml` with equivalent redirect rules
- Ensure Settings page clearly explains:
  - External API Base URL usage
  - LocalStorage device-only storage (already present)
- Optional: add a small “Connection Status” indicator:
  - A non-destructive “ping” request (only if your API supports it; otherwise keep it UI-only).

Deliverable: no broken refresh routes on Netlify; smoother deploy experience.
</phase-6_netlify_deployment_hardening_frontend_only>

<testing-and-qa (what we will verify before shipping)>
Mobile testing (use the device preview toggle):
- Account Vault: search, add, bulk add, edit, delete on phone widths
- Projects: create, edit, delete; drawer open/close; form validation visibility
- AI Subscriptions: add/delete; status badges readable; no horizontal overflow
- Sidebar: open/close on mobile; navigation works; header stays usable
- Accessibility basics: focus trapping in modals/drawers, visible focus states, tap target sizes

Regression testing:
- Ensure desktop table layouts remain unchanged or improved (no loss of density).
- Confirm API boundary remains the same (no endpoint changes).
</testing-and-qa>

<estimated-scope-and-sequencing>
To keep changes safe and high quality, we’ll implement in this order:
1) Foundation + layout cleanup
2) Mobile card layouts (Account Vault first since you’re currently on it)
3) Responsive modals (Dialog → Drawer on mobile)
4) Projects drawer edit/details (your requested UX)
5) Remaining page polish + skeleton/empty states
6) Netlify SPA redirect hardening

This sequencing ensures mobile usability improves immediately (starting on your current route), while deeper workflow upgrades remain consistent and reusable.
</estimated-scope-and-sequencing>
