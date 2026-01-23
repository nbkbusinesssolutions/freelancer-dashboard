
<context-and-goal>
You want an agency-grade, daily-use internal control dashboard that is truly mobile-first:
- No horizontal scrolling on mobile
- No unreadable/clipped text
- No misaligned elements
- All forms usable one-handed
- Tables must become card-based on mobile
- Modals must become bottom-sheet drawers on mobile
- Zero-blocking “creatable” dropdowns everywhere (already started)

You also confirmed:
- Mobile navigation should keep the current sidebar-on-mobile (sheet) pattern (not bottom nav)
- Services & Billing Log should be built now
</context-and-goal>

<what-we-have-now (quick-audit)>
1) Mobile lists
- Account Vault: already card-based on mobile.
- Projects + AI Subscriptions: already card-based on mobile.
- Dashboard: already uses card sections on mobile.
This is a strong base.

2) Biggest remaining mobile blockers (from code review)
- Account Vault dialogs still use centered <Dialog> (Upsert + Bulk Add). Must become bottom-sheet Drawer via ResponsiveModal.
- Bulk Add dialog contains a desktop-style table preview that will introduce horizontal scroll risk inside the dialog on small screens.
- Touch targets: some critical controls are below the 44px minimum:
  - SidebarTrigger is h-7/w-7 (too small).
  - Icon-only “+” add button in EmailCombobox is h-10/w-10 (40px) and unlabeled visually.
- Some page headers (Account Vault) use a horizontal button row on mobile; should become stacked full-width actions for one-hand use.
- Global “no overflow” hardening is not yet enforced (we should defensively prevent accidental overflow-x).
- Services & Billing Log doesn’t exist yet (new pages, routes, UI patterns needed, must also be mobile-perfect).

3) Dropdowns
- CreatableCombobox + EmailCombobox already satisfy the “never block due to missing values” rule for several key fields.
- Remaining classic <Select> dropdowns (e.g., project status, subscription type) are currently not searchable/creatable. Even if they’re “fixed enums”, your rule says ALL dropdowns must be searchable and allow typing. We’ll standardize them as searchable; for truly-fixed enums we’ll still allow typing but validate/normalize to the nearest valid value or store as “Other” where appropriate.
</what-we-have-now>

<implementation-plan (mobile-flawless across the entire app)>

<phase-0_mobile-hardening-baseline (global safety rails)>
Goal: prevent layout breaks before we touch individual pages.

0.1 Global overflow guard (mobile)
- Add CSS to prevent accidental horizontal scroll:
  - body/root: overflow-x: hidden
  - media elements: max-width: 100%
  - long strings: enforce break-words where needed (emails/domains/notes)
- Add a lightweight “safe layout” utility class strategy:
  - Ensure common flex containers use min-w-0 on children to prevent overflow.
  - Audit cards/tables for any “w-[something]” causing overflow.

0.2 Touch target baseline (44px minimum)
- Ensure all interactive elements meet minimum height/width:
  - Increase SidebarTrigger size on mobile (h-11 w-11).
  - Ensure icon buttons in content areas are either:
    - replaced with labeled full-width buttons on mobile (preferred), OR
    - increased to h-11 w-11 and paired with visible label text.
- Verify inputs and combobox triggers are at least h-11 on mobile.

0.3 Typography baseline
- Standardize heading scaling:
  - H1: text-xl on mobile, text-2xl on sm+
  - Body: keep text-sm for secondary, but ensure minimum readability (line-height, spacing).
- Fix “ugly wraps”:
  - Emails and domains: allow wrapping with break-words (not truncation-only).
  - Use truncation only where it is clearly safe (e.g., sidebar labels), otherwise wrap cleanly.

Deliverable: at 360px width, the app cannot accidentally overflow horizontally.
</phase-0_mobile-hardening-baseline>

<phase-1_account-vault_mobile-perfection (current route)>
Goal: make Account Vault flawless on mobile including forms.

1.1 Header actions become one-hand friendly
- Convert the “Bulk Add / Add Email” action group into a stacked layout on mobile:
  - Full-width buttons
  - Primary action emphasized (“Add Email”), secondary below (“Bulk Add”)

1.2 Convert AccountVaultUpsertDialog to ResponsiveModal
- Replace centered Dialog with ResponsiveModal:
  - Drawer on mobile with:
    - max-height (no cutoff)
    - internal scroll for content
    - sticky footer buttons (Cancel/Save always reachable)
- Ensure all fields are full-width, spaced, and thumb-friendly:
  - Email, Platform (CreatableCombobox), Username, Notes, Active toggle

1.3 Convert AccountVaultBulkAddDialog to ResponsiveModal + mobile preview redesign
- On mobile, replace the preview <Table> with:
  - A stacked “row card” list:
    - Email (wrap if long)
    - Username
    - Status badge
- Keep desktop preview table for md+.
- Ensure file upload input and preview sections stack cleanly (single column) on mobile.

1.4 EmailCombobox mobile ergonomics
- Replace/adjust the icon-only “+” add button for mobile:
  - Either show a labeled “Add” button (preferred) or make it h-11/w-11 and add visible label near it.
- Ensure the Popover content has:
  - strong background (already bg-popover) and high z-index (already z-50)
  - a max height with vertical scroll only
  - no horizontal overflow

Deliverable: Account Vault is “phone-native” for daily use.
</phase-1_account-vault_mobile-perfection>

<phase-2_navigation_mobile-first (keep sidebar, fix usability)>
Goal: keep your chosen sidebar-on-mobile approach, but make it truly thumb-friendly and non-fragile.

2.1 Make the menu trigger thumb-safe
- Increase SidebarTrigger hit area on mobile (min 44px).
- Optional: add visible “Menu” label next to icon on mobile header (prevents “tiny icon without label” issue).

2.2 Mobile sheet sidebar ergonomics
- Ensure sheet width and internal padding don’t cause text clipping.
- Ensure close gesture + accessible close are reliable (sheet already supports, but we’ll verify).

2.3 Header layout safety
- Confirm header contents never overflow at 360px:
  - Title truncates cleanly (already truncate)
  - External API Settings control stays reachable

Deliverable: navigation works one-handed; no accidental taps; no overflow.
</phase-2_navigation_mobile-first>

<phase-3_services-and-billing-log (build now, mobile-first)>
Goal: add the new module with the same “zero-blocking” rule and mobile-perfect UI.

3.1 New pages + routes + sidebar items
- Add:
  - /services (Services Catalog)
  - /billing (Client Service Records) OR a single combined /services-billing page (we’ll choose the simplest IA that fits the existing sidebar pattern)
- Update sidebar order to match workflow priority memory:
  - Dashboard → Projects → Services & Billing → AI Subscriptions → Account Vault → Settings

3.2 Services Catalog (reusable master list)
Data model (frontend-only, using the same API boundary approach as the rest of the app):
- Service:
  - id
  - serviceName (creatable, reusable)
  - serviceType (One-time/Monthly/Yearly) (searchable selector)
  - defaultPrice (optional)
  - notes
  - active/inactive

UX:
- Mobile: stacked cards with:
  - Service Name
  - Type badge
  - Default price
  - Active badge
  - Edit/Delete actions as labeled full-width buttons
- Desktop: table layout (dense)
- Add/Edit: ResponsiveModal (Drawer on mobile)
- “Service Name” uses CreatableCombobox:
  - typing a new name shows “+ Add new service”
  - auto-saves to master list and becomes reusable everywhere

3.3 Client Service Records (log)
Fields:
- Client (from Projects)
- Project (existing or “General Service”)
- Service (from Services Catalog)
- Service period (one-time/monthly/yearly)
- Amount charged (defaults from selected service; editable)
- Payment status
- Payment mode (manual + reusable)
- Notes

UX Logic:
- Selecting a project auto-fills client.
- Selecting a service auto-fills default price (still editable).
- Payment mode uses CreatableCombobox + master list:
  - if missing: “+ Add payment mode”
- Mobile: card rows with label/value stacks, clear payment badge, quick edit/delete.
- Desktop: table rows.

Important: since this app currently relies on an external REST API, we will implement this in the same “boundary-safe” way:
- If the API already supports services/log endpoints, we’ll wire to them.
- If it does not, we will implement localStorage-backed storage (clearly marked as “local only”) until API endpoints exist, so you can still use it daily without getting blocked.

Deliverable: Services & Billing exists and is fully usable on phone.
</phase-3_services-and-billing-log>

<phase-4_finish-the-last-mobile-UX-gaps (strict checklist)>
Goal: ensure the strict requirements are consistently met everywhere.

4.1 Replace remaining non-searchable selects
- Convert remaining <Select> fields to searchable controls:
  - Project Status
  - Subscription Type
  - Payment Status (new)
  - Service Type (new)
Even if values are “standard”, we’ll keep search and typing consistent (zero mental load and consistent muscle memory).

4.2 Remove any remaining “icon-only” actions on mobile
- Replace with labeled buttons or add labels + enlarge hit areas.

4.3 Loading, empty states, and inline validation
- Ensure each list shows:
  - Loading skeletons (mobile + desktop)
  - Empty states with guidance + CTA button
- Ensure validation errors are visible without scrolling surprises in drawers.

4.4 Popover/combobox stability on mobile
- Ensure popovers are:
  - not transparent (already OK)
  - high z-index (already OK)
  - constrained height and scrollable vertically only

Deliverable: no “rough edges” remain; everything feels intentional and professional.
</phase-4_finish-the-last-mobile-UX-gaps>

<responsiveness-validation (required widths)>
We will validate and fix issues at:
- 360px
- 390px
- 414px

Validation checklist per page:
- No horizontal scroll (page-level and inside drawers/popovers)
- Header doesn’t wrap awkwardly
- Buttons are >= 44px tall
- Text is readable and not clipped
- No two-column layouts on mobile (md:grid-cols-2 sections already collapse to single column; we’ll ensure any exceptions are removed)
- Drawers never cut off content; footer actions always reachable
</responsiveness-validation>

<sequencing (to ship safely without regressions)>
1) Global baseline hardening (overflow-x, touch targets, typography)
2) Account Vault dialogs + bulk preview mobile redesign (highest current impact)
3) Sidebar trigger + header mobile ergonomics
4) Build Services & Billing module (mobile-first from day 1)
5) Replace remaining Selects with searchable/consistent patterns + final QA pass at 360/390/414

This approach ensures the app becomes “daily-usable on phone” immediately and stays consistent as we add Services.
</sequencing>

<technical-notes (implementation details we will follow)>
- Use existing patterns:
  - useIsMobile()
  - ResponsiveModal (Drawer on mobile, Dialog on desktop) — we will enhance it for scroll + sticky actions.
  - CreatableCombobox + useMasterList for “never block on missing values”.
  - Mobile lists render Cards; desktop renders Tables.
- Avoid introducing horizontal scrolling:
  - On mobile, do not render <Table> anywhere (including inside dialogs).
  - Ensure long values use break-words instead of fixed widths.
- Keep the app fast:
  - Reuse React Query caches where possible.
  - Keep components simple; no heavy animation.
</technical-notes>
