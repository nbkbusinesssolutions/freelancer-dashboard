
<context>
Goal: Make the entire app “mobile-flawless” at 360/390/414px with strict rules (no horizontal scroll, no clipped/overlapping UI, thumb-friendly targets, mobile-first layouts, bottom-sheet modals on mobile), and ensure every dropdown supports “type + add new value” that auto-saves and reuses everywhere (master-list persistence).
Current state (from code + mobile preview):
- Core pages already use card-based lists on mobile (Account Vault, Projects, Services/Billing, AI Subscriptions) and ResponsiveModal exists.
- Some dialogs still use centered Dialog (External API settings) which is not mobile-first.
- Some mobile cards still use `truncate` for long values (e.g., Account Vault email) which can hide critical info.
- Mobile navigation currently uses a Sidebar sheet; you chose “Collapsible top menu” for mobile navigation.
- Dropdowns: CreatableCombobox supports “Quick add”; EmailCombobox supports quick-add to Account Vault. However, recent change moved several dropdowns toward record-only behavior; you now confirmed “Auto-save globally”.
</context>

<critical-decisions-confirmed>
- Mobile navigation: Collapsible top menu
- Dropdown behavior: Auto-save globally (persist to local master lists so new values appear everywhere)
</critical-decisions-confirmed>

<scope>
Screens/pages to audit + fix:
- Dashboard (/)
- Projects (/projects)
- Services & Billing (/services)
- AI Subscriptions (/ai-subscriptions)
- Account Vault (/account-vault)
- Settings (/settings) + External API settings modal (header)
- NotFound (/*)
Global components:
- AppShell header layout, navigation, sidebar behavior
- Dropdown/popover z-index + background
- Buttons/touch targets (>= 44px where possible)
- Modal behavior (Drawer on mobile via ResponsiveModal)
</scope>

<mobile-audit-checklist (what we will enforce)>
1) Layout
- All pages: single-column flow on mobile, consistent spacing, no horizontal scroll.
- Any “table-like” view on mobile must be cards (already mostly true; we’ll validate all remaining places).
2) Typography
- No clipped headings; avoid `truncate` for values that users must read (emails/domains/IDs).
- Comfortable line height and readable sizes (>= text-sm for body; headings clear).
3) Touch & interaction
- Primary actions use `min-h-11` (44px) and are full-width on mobile.
- Icon-only actions on mobile get labels or become full-width buttons.
4) Dropdowns
- All dropdowns become: searchable, editable, and “+ Add new value”.
- Newly added values persist globally (localStorage master lists) and immediately show in other dropdowns.
- Dropdown menus must be opaque (bg-popover) and high z-index (already for Popover; verify others).
5) Modals
- Use ResponsiveModal for forms/settings modals so mobile uses bottom-sheet drawer.
- Ensure content never cut off: max height, scrollable body, sticky footer.
6) Navigation (mobile)
- Replace sidebar on mobile with collapsible top menu (hamburger) inside the header.
- One-tap access to Dashboard/Projects/Services/AI/Vault/Settings with clear active state.
</mobile-audit-checklist>

<implementation-design>
A) Global “no horizontal scroll” + touch target guardrails
- Verify `src/index.css` already sets overflow-x hidden on html/body/root (it does).
- Add a small global utility approach:
  - Ensure all interactive controls in headers and forms use `min-h-11` on mobile (many already do; we will systematically apply).
  - Ensure any long tokens in cards use `.nbk-break-anywhere` instead of `truncate` when truncation hides the value.

B) Mobile navigation: Collapsible top menu (replace mobile sidebar)
- Update AppShell/AppSidebar integration:
  - On mobile, do not render the Sidebar/SidebarTrigger pattern.
  - Instead, add a header “Menu” button (44px) that opens a Sheet (or Drawer) from top/left with the same nav items.
  - Keep desktop sidebar behavior unchanged (md+).
  - Ensure clicking a nav item closes the menu.
  - Ensure active route highlight in the menu list.

C) Convert remaining center dialogs to ResponsiveModal (mobile drawer)
- ExternalApiSettings currently uses `<Dialog>` centered modal.
- Convert it to ResponsiveModal so it’s:
  - Drawer on mobile with safe max-height and scroll
  - Dialog on desktop
- Ensure buttons inside are min-h-11 and full-width stacking on mobile.

D) Dropdown “type + add” with global persistence everywhere
We will standardize dropdowns via a consistent pattern:
- Keep using `CreatableCombobox` UI (it already shows “Quick add”).
- Re-introduce `useMasterList` to auto-save across the app:
  - Each “domain concept” gets a storage key and default list:
    - Platforms: `nbk.master.platforms` (already used in bulk add)
    - Domain providers: `nbk.master.domainProviders`
    - Hosting platforms: `nbk.master.hostingPlatforms`
    - AI tools: `nbk.master.aiTools`
    - Service names: `nbk.master.serviceNames`
    - Client names: `nbk.master.clientNames`
    - Payment modes: `nbk.master.paymentModes`
    - Project names (billing): `nbk.master.projectNames`
- Behavior:
  - When user selects the “+ Add …” option, we:
    1) set the field value
    2) call `masterList.addItem(value)`
  - Also when user types and selects an existing item, we do nothing extra.
- Important: “standardized fields” (like cadence/status/subscription type) remain constrained (no true adding), but still searchable:
  - CreatableCombobox will show a helper label like “Select one of the standard values” and will not add to master list.

E) Per-page mobile fixes (quick wins we already see)
Account Vault
- In `AccountVaultList` mobile cards:
  - Replace `truncate` email display with `nbk-break-anywhere` (no cut-off).
  - Platform should be a Badge (you requested). Currently it’s plain text on mobile; update to show as Badge.
  - Ensure buttons are `min-h-11` (currently missing on Edit/Delete in AccountVaultList mobile).
- In `AccountVaultUpsertDialog` and `BulkAddDialog`:
  - Already ResponsiveModal and mostly min-h-11; verify all controls meet target sizes.
  - BulkAddDialog currently uses `useMasterList` while other places may not; align platform storage behavior with new global master lists.

Projects
- Ensure “Create Project” form fields all have `min-h-11` inputs and combobox buttons.
- Ensure domain/provider “Other provider” UI does not create layout gaps on mobile.
- Ensure ProjectsList cards don’t truncate critical domain values (already shows domainName with truncate; consider `nbk-break-anywhere` instead).

Services & Billing
- Most card layouts look mobile-safe; ensure all action buttons are `min-h-11` (some already are).
- Ensure CreatableCombobox buttons use `min-h-11` (some already set; ensure all).

AI Subscriptions
- Ensure tool name/platform dropdowns are backed by master lists so new entries persist everywhere.
- Ensure cards don’t truncate tool names if they can be long (switch to break-anywhere where needed).

Dashboard
- Verify no horizontal scroll and ensure attention rows don’t truncate important text (some use `truncate`).
- “Open” buttons are min-h-11 already; keep.

Settings
- Ensure Settings header uses mobile-friendly typography and spacing (already fine).
- Ensure External API dialog becomes mobile drawer.

NotFound
- Ensure no weird overflow; add consistent padding and a proper Button (optional).

F) QA loop: strict testing at 360/390/414
We will validate each page at three widths:
- 360x800
- 390x844
- 414x896
Checklist per page:
- No horizontal scroll (attempt side-scroll)
- Long text wraps (emails/domains/IDs)
- Buttons >= 44px height
- Modals/drawers scroll correctly and footer actions are reachable
- Dropdown popovers:
  - not transparent
  - not clipped
  - high z-index above everything
  - “+ Add …” works and persists

</implementation-design>

<execution-steps (sequenced)>
1) Navigation (mobile top menu)
- Implement top-menu Sheet in AppShell.
- Render AppSidebar only on md+.
- Remove SidebarTrigger from mobile header; replace with Menu button.
- Ensure active route highlighting and auto-close.

2) Dropdown global persistence standardization
- Rewire Projects/Services/AI Subscriptions/Account Vault upsert forms to use `useMasterList` for relevant fields.
- Update handlers to call `addItem()` when user adds a new value.
- Keep constrained enums constrained.

3) Mobile UI polish (no cut-off text)
- Replace `truncate` with `nbk-break-anywhere` where truncation hides critical info (emails/domains/tool names).
- Ensure platform shown as Badge on Account Vault card.
- Add `min-h-11` to remaining action buttons and key inputs.

4) Modal fixes
- Convert ExternalApiSettings Dialog to ResponsiveModal.
- Ensure content scroll + footer buttons always visible and thumb-friendly.

5) Full mobile audit pass + fixes
- Visit each route at 360/390/414 and fix any:
  - overflow bugs
  - stacking/spacing issues
  - dropdown clipping/z-index
  - tiny touch targets
  - any remaining desktop-only layouts on mobile

</execution-steps>

<risks-and-edge-cases>
- “Auto-save globally” with localStorage means:
  - values persist per device/browser (not shared between devices) unless a backend is added later.
- Some fields are “standardized” (status, cadence, subscriptionType):
  - We will keep them non-creatable to avoid data inconsistency.
- Dropdown list quality:
  - We’ll de-duplicate case-insensitively (like existing patterns) before storing and displaying.
- Mobile menu vs existing SidebarProvider:
  - We’ll ensure we don’t end up with two navigations on mobile; desktop remains unchanged.

</risks-and-edge-cases>

<done-when>
- Every page is usable one-handed on mobile at 360/390/414.
- No horizontal scroll anywhere.
- No cut-off critical text (emails/domains).
- Dropdowns everywhere: searchable + “+ Add …” and new values are reusable globally (localStorage).
- All forms use drawer modals on mobile and remain fully accessible.
- Navigation on mobile is the collapsible top menu with clear active state.
</done-when>
