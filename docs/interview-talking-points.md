# SmartStudent — Interview Talking Points

Prep notes for walking an interviewer through this project. Each story below is
something that actually happened while building this — not a rehearsed
answer — so it should hold up under follow-up questions. Numbers and file
names are accurate as of this write-up; re-check them if it's been a while
since you last touched the repo (`git log --oneline -20` is the fastest way
to refresh your memory before an interview).

---

## 30-second pitch

"SmartStudent is a full-stack resource management platform for a university —
five roles (student, lecturer, moderator, department admin, sysadmin), a
request-and-approval pipeline for course material, and an AI layer on top
(Google Gemini) that summarizes, quizzes, and chats about the actual uploaded
content instead of just the title. Backend's Express with a Clean
Architecture layering, MySQL, deployed across Vercel/Railway/Aiven's free
tiers. I built it solo, end to end, including deployment and a security fix
I found while doing it."

---

## Architecture decisions (know the "why," not just the "what")

**Clean Architecture layering** — `routes → controllers → services →
repositories`. Routes only wire middleware to a controller; controllers shape
request/response; services hold business logic and throw a typed `AppError`;
repositories are the only layer that touches SQL. If asked *why* bother with
this for a solo project: it made the test suite possible without a database
connection — services get unit-tested by mocking the repository layer, not by
spinning up MySQL (see Testing section below).

**Self-bootstrapping schema** — `ensureFoundationalSchema()` in
`backend/index.js`, awaited before anything else runs, creates every table
(including the foundational `admin`/`users`/`courses`/`resource_requests`
ones) with idempotent `CREATE TABLE IF NOT EXISTS`. A fresh MySQL instance
works with zero manual setup. This wasn't a design choice made up front — it
was a bug fix (see "Hardest bugs" below).

**Grounded AI, not hallucinated AI** — the AI summary/chat/quiz features fetch
the resource's actual file server-side and pass it to Gemini as inline
content, so answers are grounded in the real document rather than guessed
from the title. Recommendations and search-assist are explicitly constrained
to a candidate list and filtered against it after generation, so the model
can't invent a resource ID that doesn't exist.

---

## Hardest bugs I fixed

### 1. The dropdown that worked everywhere except production

**The bug:** the admin profile dropdown rendered correctly in the DOM —
inspecting it showed the menu items right there — but stayed invisible after
clicking, and *only* in the deployed build. Local dev was fine every time.

**Root cause:** `bootstrap.min.css` was imported globally and defines its own
`.dropdown-menu { display: none; ... }` for Bootstrap's own dropdown
component. My custom `.dropdown-menu` never re-declared `display`, so
Bootstrap's rule won once Vite/Rollup concatenated all CSS into one
production bundle. Dev mode never showed it because Vite injects
per-component styles incrementally as routes get visited, so the collision
only became *consistent* once every page's CSS — Bootstrap included — was
always present at once, which only happens in a production bundle.

**How I found it:** ran a local production build (`vite build && vite
preview`) instead of trusting dev mode, then used Playwright to inspect
`getComputedStyle()` on the actual dropdown element and watched which CSS
rule was winning. That's what turned "it's invisible" into "Bootstrap's
`display: none` is winning over mine."

**The mistake I made along the way, and why it matters:** my first fix was to
rip out Bootstrap entirely, having checked that nothing *seemed* to use it.
That check was wrong — 8 pages (Login, Register, AdminLogin,
Forgot/ResetPassword, Profile, Lecturer/ModeratorDashboard) genuinely use
`.form-control` and `.btn-primary` for real styling. I caught this because
the person I was building it for asked a follow-up question that made me
re-verify, and I reverted the removal in the next commit rather than
patching around it. The actual fix was one line: `.dropdown-menu { display:
block; }` in my own CSS, which wins regardless of bundling order without
touching anything Bootstrap owns. If asked "what would you do differently":
grep for every Bootstrap class name across the actual page components before
concluding something is unused, not just check whether the import "looks"
leftover.

### 2. A fresh database silently failed via cascading foreign-key errors

**The bug:** discovered while provisioning a new hosted MySQL instance
(Aiven) for deployment — every migration in `index.js` failed.

**Root cause:** the four foundational tables (`admin`, `users`, `courses`,
`resource_requests`) had only ever been created once, by hand, via a
`database_setup.sql` script that nobody had run again since. Every later
migration assumed those four already existed. On a genuinely fresh database
there was nothing to cascade from.

**Fix:** `ensureFoundationalSchema()`, matching the live schema exactly
(including columns added later by ad hoc `ALTER TABLE` checks elsewhere in
the file), `await`ed before any other migration runs. Verified by dropping
and rebuilding the entire Aiven database from empty and confirming the app
boots clean. This is the fix that makes "clone the repo and run `node
index.js`" actually true in the README — worth mentioning if asked about
onboarding/DX.

### 3. Case-sensitive imports that only broke on Linux

**The bug:** Vercel's build failed on an import Windows never complained
about.

**Root cause:** `RegisterPage.jsx` imported `./LoginPage.css`, but the file
on disk was named `Loginpage.css` (lowercase p). Windows' filesystem is
case-insensitive, so it resolved locally without complaint; Vercel's Linux
build environment is case-sensitive and failed on the first mismatch it hit.

**Fix:** two-step `git mv` (can't rename case-only on a case-insensitive
filesystem in one move — you have to rename to a throwaway name first, then
to the target). Then I didn't just fix the one that broke the build — I
grepped every relative import in `src/` for similar mismatches and found a
second one (`Whychoose.jsx` → `WhyChoose.css`, actually `Whychoose.css`) that
hadn't been hit yet but would have failed the same way eventually. Good
example of "fix the bug you found, then look for its siblings" if asked
about debugging methodology.

### 4. Free-tier MySQL going to sleep

**The bug:** the deployed backend would work fine, then start throwing
`ENOTFOUND` for the database host after a period of no traffic.

**Root cause:** Aiven's free tier auto-powers-off the database after
inactivity to save resources, and doesn't wake back up on its own — someone
has to manually resume it in the dashboard.

**Fix:** a `setInterval` in `backend/index.js` that pings `SELECT 1` every 4
minutes, cheap enough to be a no-op cost-wise but frequent enough that the
database never looks idle to Aiven. This is a real production trade-off
worth being upfront about if asked: it's a workaround for a free-tier
limitation, not something you'd want on a real paid instance where idle
connections cost you differently — the honest answer is "this is the right
call for a free-tier demo project, not for production traffic patterns."

---

## The security fix: SSRF in the AI resource fetcher

The AI summary/chat features fetch a lecturer-supplied resource URL
server-side to ground Gemini's output in the real file. That URL is
attacker-influenced (any lecturer can supply it), and the fetch happens
server-side — the textbook setup for Server-Side Request Forgery, where a
malicious URL could make the server reach internal services or a cloud
metadata endpoint (`169.254.169.254`) instead of a real PDF.

**Fix** (`backend/utils/resourceContentFetcher.js`): before fetching,
`isSafeResourceUrl()` rejects non-http(s) protocols, rejects `localhost`, and
resolves the hostname via DNS then checks *every* returned address against
private/reserved IPv4 and IPv6 ranges (`10.x`, `172.16–31.x`, `192.168.x`,
loopback, link-local, and IPv6 equivalents including `::1`/`fc00::/7`) before
allowing the fetch to proceed. It fails closed — anything it can't parse or
resolve is treated as unsafe.

If asked why check *after* DNS resolution instead of just validating the
hostname string: a hostname can resolve to a private IP even if it doesn't
look like one (DNS rebinding), so the check has to happen on the resolved
address, not the string.

Covered by unit tests in `backend/__tests__/resourceContentFetcher.test.js`
— including the cloud metadata endpoint case specifically, since that's the
one that turns an SSRF into "attacker reads your cloud credentials."

---

## Testing philosophy

37 tests total (24 backend, 13 frontend), all mocking the way down to the
unit under test rather than hitting a real database or browser:

- **Backend service tests mock the repository layer**, not the database.
  `authService.test.js` verifies real business logic — duplicate-username
  rejection, wrong-password rejection, the legacy-plaintext-password
  upgrade-on-login path, and that password reset returns identically whether
  or not the email exists (account enumeration protection) — without ever
  opening a MySQL connection. This only worked cleanly *because* of the
  Clean Architecture layering: the service doesn't know or care that its
  repository calls are mocked.
- **The SSRF guard is tested at the unit level** against known private/public
  IP ranges rather than trying to spin up a fake internal server to prove the
  block works.
- **Frontend tests are narrow on purpose**: JWT decode/expiry edge cases
  (malformed token, no `exp` claim, expired vs not) and one component's
  actual interactive behavior (`StarRating`'s read-only vs clickable modes).
  Not a broad snapshot-everything suite — each test asserts a specific
  behavior that could plausibly regress.

If asked "why not more coverage": time-boxed to the highest-value, most
regression-prone logic (auth, security) rather than chasing a coverage
percentage. Happy to talk through what I'd add next (route-level integration
tests with a real test database would be the natural next layer).

---

## Deployment story

Three free-tier services, zero cost: **Vercel** (frontend, static + SPA
rewrite), **Railway** (backend, Node web service), **Aiven** (MySQL). None of
this was "docker-compose up" simple — worth having the shape of the story
ready even if you don't walk through every step:

- Railway's build failed until Root Directory was explicitly set to
  `backend` (monorepo, and it doesn't infer that).
- First successful deploy crashed immediately with `ECONNREFUSED
  127.0.0.1:3306` — missing DB env vars, since Railway doesn't share env vars
  with a separately-hosted database by default.
- Client-side routes 404'd on direct load/refresh (`/admin/login` typed
  directly into the address bar) until `vercel.json` added an SPA rewrite —
  a static host looks for a literal matching file by default; React Router
  routes don't exist as files.

If asked "what would you automate about this next time": a CI step that
deploys on merge to main instead of manual dashboard clicks — the GitHub
Actions workflow in `.github/workflows/ci.yml` currently runs lint/tests/build
on every push but stops short of deploying.

---

## Performance: the bundle-size fix

The production build warned about a 707 KB main JS chunk (Vite's threshold is
500 KB) — every page was eagerly imported into one bundle regardless of which
route the visitor actually loaded. Converted every page-level import in
`App.jsx` to `React.lazy()` behind a single route-level `<Suspense>`
boundary. Main chunk dropped to ~290 KB; the rest split into per-route chunks
loaded on demand (the largest, `AdminDashboard` at ~164 KB, only downloads
for someone who actually logs in as admin). No warning on build anymore, and
the change is purely mechanical — same components, same behavior, just
loaded lazily.

---

## Resilience: the error boundary

Before this, a thrown error anywhere in a page component blanked the *entire*
app — Navbar and Footer included — because there was nothing between React's
default "unmount everything" behavior and the render tree. Wrapped the routed
content in an `ErrorBoundary` (`frontend/src/components/ErrorBoundary.jsx`)
so navigation stays usable and the user sees a recoverable "Something went
wrong / Go Home" card instead of a blank screen. Small thing, but it's the
difference between "the whole site is down" and "one page had a bug" from a
user's perspective.

---

## Accessibility

Not just alt text (which was already solid everywhere — every `<img>` in the
codebase had one). Two real, concrete gaps found and fixed:

- The mobile hamburger menu was a `<div onClick>` — invisible to screen
  readers and completely unreachable by keyboard, since divs aren't in the
  tab order. Converted to a real `<button>` with `aria-label`/`aria-expanded`.
- Form labels across every auth screen were plain `<label>` text with no
  `htmlFor`, so screen readers couldn't announce which field a label
  described, and clicking a label didn't focus its input. Added matching
  `id`/`htmlFor` pairs across login, register, admin login, forgot/reset
  password, the upload form, and the profile page.

If asked how these were found: grep first (`<img\b` for missing `alt`,
`<label` for missing `htmlFor`), not a full manual click-through — a targeted
static audit of a known-common defect pattern is a lot faster than eyeballing
every page, and it's exhaustive in a way manual testing isn't.

---

## Likely follow-up questions and how to answer them honestly

**"What would you do differently if you started over?"**
Write the Clean Architecture layering from commit one instead of migrating
into it partway through (there are commits literally titled "Migrate X to
Clean Architecture" — that's real, not hidden). Also: integration tests
against a real (containerized) test database, not just unit tests against
mocked repositories.

**"What's the biggest risk in this codebase right now?"**
The Aiven keep-alive ping is a workaround for a free-tier limitation, not a
production-grade solution — a real deployment would use a database that
doesn't sleep, or a proper connection-pool health check instead of a fixed
4-minute timer. Also honest: this is a solo project without code review, so
the main mitigation for that has been leaning hard on automated tests and
lint for the highest-risk logic (auth, security) rather than trusting manual
review that never happened.

**"How did you decide what to test?"**
Business logic with real failure modes and security-sensitive code, not
coverage percentage — auth service edge cases and the SSRF guard, not every
CRUD repository method.
