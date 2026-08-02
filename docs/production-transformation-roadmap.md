# SmartStudent — Production Transformation Roadmap

This extends `docs/architecture-review-roadmap.md` (Phases 1–2 of that
document are done and pushed — see git history). This document covers new
ground: the visual/navigation overhaul you just asked for, closing the
remaining gaps in your feature list, and folding in the backend hardening
items that were already queued (Phase 3–4 of the original review) so there's
one place to track everything left.

No code has been written yet. This is the plan only.

---

## 1. Theme — Slate + Emerald (confirmed)

Every color in the app is already piped through CSS custom properties in
`frontend/src/styles/theme.css` — this is exactly the payoff of that design-
token system: the whole visual identity swaps by editing **one file**, not
40. The ~40 files that consume `var(--color-accent)` etc. don't need
individual edits for the base swap.

**New tokens** (replacing the current dark-blue set):

| Token | Current | New |
|---|---|---|
| `--color-bg` | `#030712` (blue-black) | `#0b0f0e` (neutral near-black, no blue tint) |
| `--color-surface` | `rgba(15,23,42,0.6)` | `rgba(19,26,24,0.6)` |
| `--color-surface-strong` | `rgba(15,23,42,0.92)` | `rgba(19,26,24,0.92)` |
| `--color-border` | `rgba(148,163,184,0.2)` | `rgba(160,175,170,0.18)` |
| `--color-text` | `#f8fafc` | `#f1f5f4` |
| `--color-text-secondary` | `#cbd5e1` | `#cbd2cf` |
| `--color-text-muted` | `#94a3b8` | `#8a9a95` |
| `--color-accent-cyan` | `#22d3ee` (cyan) | `#14b8a6` (teal) |
| `--color-accent` | `#6366f1` (indigo) | `#10b981` (emerald) |
| `--color-accent-strong` | `#4f46e5` | `#059669` |
| `--gradient-accent` | cyan→indigo | `linear-gradient(90deg, #10b981, #14b8a6)` |
| `--shadow-glow` | indigo-tinted | emerald-tinted (`rgba(16,185,129,0.25)`) |

**Deliberately kept as-is**: `--color-accent-violet`, `--color-accent-pink`,
`--color-gold*` (the admin-tier accent), `--color-danger*`,
`--color-success`, `--color-warning`. These are secondary/rare-use accents,
not the pervasive blue identity — removing them too would flatten the
palette for no reason. `--color-success` (`#34d399`) already reads as green
and fits the new palette better than it fit the old one.

**Verification plan**: after the swap, grep every CSS file for hardcoded hex
colors that *aren't* using the tokens (the earlier architecture review found
several — hardcoded border-radius values, and likely some hardcoded colors
too) and convert the ones that visually clash with the new palette. Then a
full visual pass page-by-page (as close to real browser verification as this
session's sandbox allows — see the TanStack Query commit's notes on that
limitation) before calling it done.

---

## 2. Navigation — Sidebar shell for the authenticated app

**Scope** (my interpretation of your spec — flag if this is wrong before I
build it):

- **Keep the top `Navbar`** on: Homepage, About, Contact, Login, Register,
  Forgot/Reset Password, Verify Email. These are pre-auth/marketing pages —
  a sidebar shell is an authenticated-app convention, not a marketing-site
  one.
- **Replace with a new `Sidebar`** on everything else: Dashboard, Profile,
  Settings (new), Resources, Achievements, Study Planner, Upload, and every
  `Admin*`/`Lecturer*`/`Moderator*` page — for every role (student, lecturer,
  moderator, dept_admin, sysadmin alike, with role-appropriate menu items).
- **Footer**: drops off the sidebar-shell pages too (matches Navbar's scope)
  — a marketing footer doesn't belong in an app dashboard shell.

**Behavior**:
- **Desktop**: expanded by default (icons + labels), collapsible to an
  icon-only mini-rail (~64px) via a toggle button pinned at the top of the
  sidebar. Collapsed/expanded state persists in `localStorage` so it doesn't
  reset every page load.
- **Mobile** (<768px): off-canvas drawer, hidden by default, opened via a
  hamburger button in a slim top bar (the sidebar's mobile equivalent of
  today's navbar hamburger), closes on nav-item click or backdrop tap.
- **Role-aware content**: one reusable `Sidebar` component, not separate
  student/admin components — it renders a different menu-item list based on
  `user.role` / `admin.adminRole`, mirroring the conditional blocks already
  in `Navbar.jsx` today. Keeps the Clean Architecture spirit (one place to
  add a new nav item, not N places).
- **Implementation shape**: a new `AppShell` layout component in `App.jsx`
  that decides Navbar-shell vs Sidebar-shell per route (a `PUBLIC_ROUTES`
  allowlist), so this is a routing/layout change, not a per-page rewrite —
  individual pages don't need to know which shell they're in.

---

## 3. Toast notifications

Every page today shows errors/success messages as inline
`<p style={{color:'red'}}>` text, inconsistently placed per page. Replacing
with `react-hot-toast` (small bundle, simple API, easy to theme against the
new token system):

- One `<Toaster/>` mounted once at the app root.
- A thin wrapper (`utils/notify.js`: `notify.success()`/`notify.error()`) so
  every call site stays a one-liner and the toast library choice is swapped
  in one place if it's ever changed later.
- Converts the try/catch error-message patterns already used consistently
  across every page (a real advantage of the "unify frontend API access"
  work from Phase 2 — every page already funnels errors through the same
  `err.message` shape, so this is a mechanical swap, not a redesign).

---

## 4. Settings page (new)

Scoped deliberately narrow for a real v1 rather than padded with
placeholder sections:

- New route `/settings`, sidebar-linked, for any authenticated role.
- **Theme preference**: if a light mode is added (see Phase 4 below), this
  is where the toggle lives.
- **Email notification preferences**: on/off toggle for non-critical emails
  (request-approved/rejected notifications) — needs one new `users` column
  (`email_notifications_enabled`, default `1`) via a new migration file
  (`backend/migrations/0002_...sql`, using the migration system built in
  Phase 2) plus a small backend endpoint and mailer check.
- Account-level actions (password change) **stay on Profile**, not
  duplicated here — Settings is app preferences, Profile is identity.

---

## Phase 1 (Critical) — the shell everything else sits on

1. Apply the Slate + Emerald theme (`theme.css` + hardcoded-color audit).
2. Build the `Sidebar` component + `AppShell` routing split (Navbar-shell
   vs Sidebar-shell), collapsible + persisted state, role-aware menu items,
   mobile off-canvas behavior.
3. Toast notification system (`react-hot-toast` + `notify.js` wrapper),
   converted across all pages currently using inline error/success text.
4. Verify nothing broke: every route still reachable, every role sees the
   right nav items, mobile drawer works, no layout regressions on the pages
   that keep the Navbar.

## Phase 2 (Important) — close the partially-done items

1. Settings page (theme + email-notification preferences, as scoped above).
2. Loading skeleton coverage extended from 3 pages to every data-fetching
   page (the `Skeleton` component already exists — this is applying it
   consistently, not building it).
3. Responsive design audit — systematically check every page at
   mobile/tablet/desktop breakpoints against the new sidebar shell
   specifically (a new layout, so this needs fresh verification rather than
   trusting the old navbar-era breakpoints still hold).
4. Landing page (Homepage) visual pass against the new theme — hero,
   stats, feature highlights already exist; this is restyling, not rebuilding.
5. Dashboard analytics widgets (Chart.js) restyled to match the new palette.

## Phase 3 (Advanced) — verify + surface what already exists

Everything in this phase already works end-to-end (bookmarks, ratings,
comments, download tracking, real-time notifications, admin analytics,
email notifications, AI features, cloud image storage, search/filtering) —
this phase is about **surfacing it well in the new shell**, not rebuilding:

1. Give the AI features (summary/quiz/flashcards/chat/study-plan/
   recommendations) a single, discoverable entry point in the new sidebar
   rather than being spread across resource-detail panels only.
2. Confirm every existing feature still renders/functions correctly inside
   the new Sidebar shell (this is the real risk of a navigation rewrite —
   regressions in features that didn't change, just moved shells).
3. Full regression pass on the resource-hub/comments/ratings/bookmarks flow
   specifically, since that's the highest-surface-area existing feature set.

## Phase 4 (Production Quality) — carried over from the original review

Still open from `docs/architecture-review-roadmap.md`'s Phase 3–4, listed
here so there's one roadmap instead of two to track:

1. Light mode (a real second theme variant + toggle, persisted) — the only
   part of "dark mode" that doesn't already exist, since the app is already
   dark-only today.
2. Structured backend logging (Pino/Winston, replacing `console.log`).
3. CI/CD deploy automation (CI already exists and is green; nothing
   auto-deploys yet — Vercel already auto-deploys on push, Railway now does
   too after today's fix, so this is really just formalizing what's already
   working plus adding it for any environment that isn't yet covered).
4. Security hardening: account-level brute-force protection, refresh-token
   flow, explicit CSP, the httpOnly-cookie trade-off discussion.
5. Expanded test coverage: integration tests against a real test database,
   page-level frontend tests for the new Sidebar/Settings/Toast additions.
6. Dockerized local dev (Dockerfile + docker-compose) for environment
   parity.

---

## Sequencing note

Phase 1 is a hard prerequisite for Phase 2/3 verification (can't visually
regression-test pages against a shell that doesn't exist yet), so it's
strictly first. Phase 4 items are independent of the UI work and could be
interleaved, but keeping them last matches the "finish one thing completely
before starting the next" instruction — better to ship the shell rewrite
as one coherent, fully-verified unit than to have it half-done alongside
unrelated backend work.
