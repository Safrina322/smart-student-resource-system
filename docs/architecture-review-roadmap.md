# SmartStudent — Architecture Review & Improvement Roadmap

Full-codebase review conducted by reading the actual source (not assumptions):
every backend route/controller/service/repository, the complete database
schema as defined in `backend/index.js`, the frontend page/component/service
inventory, auth flow, middleware stack, and CI config. Findings below are
cited with file paths. No code has been changed as part of this review —
this is the analysis and plan only, per your request.

---

## 1. Folder Structure

**Strengths**
- Backend is already properly layered: `routes/ → controllers/ → services/ →
  repositories/`, plus dedicated `validation/`, `middleware/`, `utils/`. This
  is real Clean Architecture, not just folder names — verified by reading
  `authService.js`, which contains business logic and throws `AppError`,
  while `userRepository.js` contains only parameterized SQL.
- Naming is consistent per-feature (`adminRequestController.js` →
  `adminRequestService.js` → `adminRequestRepository.js`).

**Problems**
- **Dead and duplicate frontend files**, confirmed unreferenced anywhere in
  the codebase:
  - `frontend/src/components/Resoursecard.jsx` — typo duplicate of
    `ResourceCard.jsx`, never imported.
  - `frontend/src/pages/UploadResoursePage.jsx` — typo duplicate of
    `UserRequestResource.jsx`, never imported.
  - `frontend/src/pages/Profile.jsx` — duplicate of `ProfilePage.jsx`, never
    imported.
  - `frontend/src/pages/CourselistPage.jsx` — never imported anywhere.
  - `frontend/src/pages/Adminpanelpage.jsx` — imported and lazy-loaded in
    `App.jsx` (`const AdminPanelPage = lazy(...)`) but never rendered in any
    `<Route>`. Dead import shipping dead code to the bundle.
- No `frontend/src/constants/` — role strings (`"student"`, `"lecturer"`,
  `"moderator"`, `"dept_admin"`, `"sysadmin"`) are repeated as string literals
  across both frontend and backend with no single source of truth.
- No shared frontend config module — `import.meta.env.VITE_API_URL` is read
  independently in three places (`utils/api.js`, `services/apiClient.js`,
  `services/socketClient.js`) instead of one config file.

---

## 2. React Architecture

**Strengths**
- Route-level code splitting (added this session) — main bundle ~290 KB, per-
  route chunks load on demand.
- A real, if thin, service layer exists for newer features
  (`services/aiService.js`, `services/resourceHubService.js`, etc.), backed
  by a proper Axios instance with request/response interceptors
  (`services/apiClient.js`) that centralizes auth-header injection and error
  message normalization.
- Reusable components exist and are actually reused: `StarRating`,
  `Skeleton`, `PageLoader`, `NotificationBell`.

**Problems**
- **Two competing HTTP-calling patterns coexist.** Newer features go through
  `apiClient.js` (Axios + interceptors). Older/larger pages —
  `Dashboard.jsx`, `ResourceListPage.jsx`, `AdminRequests.jsx`,
  `UserRequestResource.jsx` — call `apiCall()`/`getAuthHeader()` from
  `utils/api.js` directly inside the component, bypassing the service layer
  entirely and re-implementing auth-header attachment and error handling
  per call site. This is the single biggest frontend consistency gap.
- **No server-state library.** Every data-fetching page hand-rolls its own
  `useState` for `data`/`loading`/`error` plus a `useEffect` fetch — verified
  directly in `Dashboard.jsx`, `ResourceListPage.jsx`, `AchievementsPage.jsx`,
  `AdminRequests.jsx`. No caching, no request deduplication, no automatic
  refetch-on-focus, no shared cache between components that need the same
  data (e.g. unread notification count is fetched independently by both
  `NotificationBell` and `NotificationsPanel`).
- Only two custom hooks exist (`useAuth`, `useDebounce`) despite dozens of
  pages repeating near-identical fetch/loading/error boilerplate that could
  be extracted.
- Only one global `ErrorBoundary` (added this session) around the entire
  route tree — a crash inside one dashboard widget still takes down the
  whole page, just not the whole app.
- Styling is plain global CSS per page/component with a shared design-token
  file (`theme.css`) that's under-used — a prior grep this session found
  `border-radius` alone hardcoded to at least 10 different pixel values
  across ~40 files instead of the three tokens (`--radius-sm/md/lg`)
  `theme.css` already defines.

---

## 3. Express Architecture

**Strengths**
- Consistent `AppError` + `asyncHandler` + central error-handling middleware
  — every service throws a typed error with a status code, every route is
  wrapped, one middleware turns it into a JSON response. Verified in
  `backend/index.js` (`app.use((err, req, res, next) => ...)`).
- One generic Zod-based `validate(schema)` middleware used identically by
  every route file — not reinvented per feature.
- Auth is layered correctly: `authMiddleware`/`adminAuth` attach `req.user`,
  controllers never touch `req.headers` directly.

**Problems**
- **No real migration system.** ~300 lines of imperative "check if column
  exists via `SHOW COLUMNS`, then `ALTER TABLE` if missing" logic live
  directly in `backend/index.js` (`ensureExtendedLearningSchema`,
  `ensureRoleModel`, `ensureAuthColumns`, `ensureResourcesColumns`). This
  works, but: there's no way to see "what changed and when" beyond reading
  code comments, no rollback path, and it's mixed into the app's entrypoint
  file rather than being its own concern.
- **Those same migration functions are not awaited.** Only
  `ensureFoundationalSchema()` is awaited before the app proceeds
  (`await ensureFoundationalSchema();`). `ensureExtendedLearningSchema()`,
  `ensureRoleModel()`, `ensureAuthColumns()`, and `ensureResourcesColumns()`
  are all fire-and-forget — the server can start accepting requests (and the
  demo-data seed can run) before those `ALTER TABLE`/`CREATE TABLE IF NOT
  EXISTS` calls resolve. On a slow first boot against a fresh database this
  is a real race condition, not a theoretical one.
- **Mixed database access styles**: the bootstrap code in `index.js` uses
  raw callback-style `db.query(sql, cb)`, while every repository uses the
  promise-wrapped `queryAsync`. Not incorrect, but inconsistent, and it's
  exactly the code that has the race condition above — callback style makes
  "did this finish" harder to reason about than `await` would.
- **Rate limiting is auth-only.** `middleware/rateLimiter.js` defines exactly
  one limiter (`authLimiter`), applied only to `/api/auth/*`. The AI routes
  (`/api/ai/*`), which call the metered, paid Gemini API, have none.
  `/api/ai/search-assist` specifically has **neither auth nor rate
  limiting** (`aiRoutes.js` line 19: `router.post("/search-assist",
  validate(searchAssistSchema), asyncHandler(...))`, before `router.use
  (authMiddleware)` on the next line) — meaning any unauthenticated caller
  can drive Gemini API cost indefinitely.
- **`ADMIN_JWT_SECRET` is dead configuration.** It's defined in
  `.env.example` but grepping every `JWT_SECRET` reference in the backend
  shows admin and user tokens are both signed and verified with the same
  `process.env.JWT_SECRET` (`services/adminAuthService.js`,
  `services/authService.js`, `middleware/adminAuth.js`,
  `middleware/authMiddleware.js` all reference the same variable). Either
  wire the separate secret up for real (recommended — a bug or leak in the
  student-facing signing path shouldn't be able to forge an admin token) or
  remove the unused env var so it stops implying a separation that doesn't
  exist.
- No request logging middleware (no `morgan`/`pino-http`) — only ad hoc
  `console.log`/`console.error` with emoji prefixes, no log levels, no
  request IDs.
- No `/health` or `/api/health` endpoint for host-level monitoring (Railway,
  uptime checks, etc.) — confirmed absent via search.
- `process.on("uncaughtException"/"unhandledRejection")` only logs and lets
  the process keep running. Node's own guidance is that after an uncaught
  exception the process is in an unknown state and should be restarted by a
  supervisor, not kept alive — currently there's no supervisor-friendly exit
  here at all.
- No API versioning (`/api/v1/...`) — fine at current scale, worth deciding
  deliberately rather than by default before the API has external
  consumers.

---

## 4. Database Design

**Strengths**
- Real foreign keys with deliberate `ON DELETE` behavior per relationship
  (`CASCADE` for ownership, `SET NULL` for "who approved this" audit
  references) — this is not a schema that skipped referential integrity.
- Indexes exist on the columns that actually get filtered/joined on
  (`idx_status`, `idx_user_id`, composite `idx_user_course_accessed`, etc.),
  not just primary keys.
- `UNIQUE KEY` constraints correctly model real invariants (one rating per
  user per resource, one bookmark per user per resource, one report
  schedule per admin).

**Problems**
- ~~Three overlapping "resource" concepts~~ — **investigated and resolved
  (Phase 2).** What looked at first read like three deliberately different
  models turned out, on tracing every read/write path, to be two real ones
  plus one dead one:
  - `resource_requests` — a student "please add this content" request
    pipeline, actively read and written by `requestRoutes`/
    `adminRequestRoutes`. Real, distinct workflow.
  - `lecturer_resources` (+ `resource_comments`/`resource_ratings`/
    `resource_bookmarks`/`ai_content_cache` built on top of it) — the
    fully-featured, actually-moderated content model with a real
    review/status pipeline. Real, distinct workflow.
  - `resources` — had **no write path anywhere in the app** except a
    one-time boot seed. No admin UI, no form, no endpoint ever inserted a
    row. Its one consumer (`ResourceListPage.jsx`) fetched it to render a
    "Saved" stat and list, while that *same page* also hardcoded an
    almost-identical array of the same 5 links directly in the component
    (`onlineResources`) — the DB round-trip was pure overhead for data that
    was also just sitting in the source file. It was also joined into
    global search results. This wasn't a deliberate third workflow, it was
    dead weight that kept returning data because it had been seeded once.
    **Removed entirely**: the table, its repository/service/controller/
    route, its search-index entry, and the redundant "Saved" section and
    stat card in `ResourceListPage.jsx`. Verified via a live boot against
    the real database (schema created cleanly with no `resources` table),
    `/api/resources` now correctly 404s, and `/api/search` still returns
    correct results from the two real sources.
- **No formal migration tool.** Schema changes are tracked as JS functions
  with names like `ensureAuthColumns`, not as versioned, ordered migration
  files. There's no single place to see the full migration history in
  order, and no rollback mechanism.
- **Hardcoded seed credentials in source**: `admin123` and `Demo@12345`
  (`index.js`, `seedDefaultAdmin`/`seedDemoRoleAccounts`). Fine for a portfolio
  demo where you *want* an interviewer to be able to log in immediately —
  but it should be a documented, deliberate decision (README already lists
  these as demo credentials, which is the right call), not something that
  reads as an oversight. Consider making the seeded passwords
  env-configurable so the same code is safe to point at a real production
  database later without a manual follow-up step.

---

## 5. Authentication

**Strengths**
- Bcrypt hashing, and a genuinely nice detail: legacy plaintext passwords are
  transparently upgraded to bcrypt on next successful login
  (`authService.js`).
- Password reset and email verification both use single-use, expiring,
  randomly-generated tokens, not predictable values.
- Password reset response is identical whether or not the email exists —
  actual account-enumeration protection, not just a comment claiming it.
- Admin and student sessions are modeled as genuinely separate concerns
  (separate tables, separate middleware, mutually-exclusive client-side
  sessions) — appropriate for the privilege gap between them.

**Problems**
- JWT lives in `localStorage`, not an `httpOnly` cookie — the standard SPA
  trade-off (simpler CORS, XSS can steal the token) rather than the
  cookie-based alternative (needs CSRF protection, more complex CORS with
  credentials). Worth being able to discuss the trade-off, not necessarily
  changing it — Phase 4 candidate at most, cookie migration is a meaningful
  undertaking.
- **`ADMIN_JWT_SECRET` unused** (see Express section above) — the two
  privilege tiers share one signing secret today despite the env scaffolding
  implying otherwise.
- No account-level lockout — brute-force protection is purely IP-based
  (`authLimiter`, 20 attempts / 15 min per IP). A distributed attacker
  targeting one specific account from many IPs isn't slowed down at all.
- No refresh-token flow — a session simply expires (1h default, 30d with
  "remember me") and the user is bounced to the login page with no silent
  renewal.

---

## 6. API Structure

**Strengths**
- Consistent REST-ish resource naming (`/api/admin/requests`,
  `/api/lecturer/resources`, `/api/resource-hub`).
- Every route's request shape is validated by a schema before the
  controller runs — no controller trusts unvalidated `req.body`.
- A real route table already exists in the README.

**Problems**
- No OpenAPI/Swagger spec and no Postman collection — the README table is
  documentation-by-hand, which drifts as routes change. Worth generating
  from the Zod schemas that already exist (they're most of the way to a
  spec already) rather than hand-maintaining both.
- No API versioning strategy decided.
- `/api/ai/search-assist`'s auth exemption (noted above) reads as
  intentional from the code comment ("rides on the same public search data
  as `/api/search`"), but pairing "public" with "calls a metered external
  API" needs its own rate limit even if auth stays optional.

---

## 7. UI/UX

**Strengths** (from this session's work + existing state)
- Design-token file (`theme.css`) establishes a real dark-mode-first visual
  language (accent colors, radii, shadows) rather than ad hoc colors
  everywhere.
- Recently hardened: keyboard-accessible controls, associated form labels,
  reduced hero section height, upload-confirmation visible without
  scrolling, auto-login after registration.

**Problems**
- Token *usage* is inconsistent — the design system exists but isn't the
  only source of visual values (see the border-radius example above).
- No loading-skeleton coverage audit — `Skeleton.jsx` exists and is used in
  some places (`Dashboard`, `AchievementsPage`) but not verified consistent
  across every data-fetching page.
- No responsive-design audit beyond the navbar (which was fixed reactively
  this session after a bug report, not proactively tested across
  breakpoints for every page).
- No dark/light theme toggle — `theme.css` is dark-only by design, which is
  a legitimate choice, but worth stating as a choice rather than a gap if
  asked.

---

## 8. Security

**Strengths**
- Helmet enabled globally; CORS is an explicit allowlist function, not
  `origin: "*"`.
- SSRF protection on the AI resource fetcher (validates resolved IPs against
  private/reserved ranges, including the cloud metadata address) — a real,
  non-obvious vulnerability class correctly defended against.
- Zod validation on every route prevents most injection/malformed-input
  classes at the boundary; parameterized SQL everywhere (verified — no
  string-concatenated queries found in any repository).
- `helmet`'s `crossOriginResourcePolicy` is deliberately relaxed only for
  static file serving, with a comment explaining exactly why, rather than
  disabled globally.

**Problems** (priority order)
1. AI endpoints (paid external API) lack rate limiting; one endpoint lacks
   auth entirely — real cost-abuse exposure (see Express section).
2. `ADMIN_JWT_SECRET` scaffolded but unused — admin and student tokens share
   a signing secret.
3. No account-level brute-force protection, only IP-based.
4. No Content-Security-Policy customization beyond Helmet's defaults — worth
   an explicit policy once the deployed frontend origin is stable, rather
   than relying on defaults.
5. ~~No dependency vulnerability scanning in CI~~ — **done (Phase 2):**
   `npm audit --omit=dev --audit-level=high` runs in both CI jobs. Two known
   findings are deliberately not CI-blocking and need tracking:
   - `react-router`/`react-router-dom` (frontend, production dependency):
     moderate-severity open-redirect and constructor-injection advisories,
     fixed only in v7 — the v6 line has no further patches. Upgrading is a
     real major-version migration (data router APIs changed), not a
     `npm audit fix`; worth scoping as its own task rather than forcing it
     under this one.
   - A transitive `eslint` devDependency (`brace-expansion`, high severity):
     dev-tooling only, never ships, not attacker-reachable for this project.
     Fixable via `npm audit fix --force` (bumps eslint to v10, breaking) if
     wanted, but not worth forcing blind given the real-world risk is ~zero.
6. Seeded demo credentials in source (flagged above under Database, security
   angle: acceptable for a demo, but should never reach a database that also
   holds real user data).

---

## 9. Performance

**Strengths**
- Route-based code splitting (this session) — no more 707 KB single bundle.
- AI-generated content (summaries/quizzes/flashcards) is cached per resource
  in `ai_content_cache`, avoiding repeat API spend and repeat latency.
- Appropriate DB indexes on filter/join columns (see Database section).

**Problems**
- No HTTP response caching / `Cache-Control` headers on any API route —
  every request round-trips to MySQL even for rarely-changing data (course
  catalog, popular resources).
- No pagination visible on list endpoints that could grow unbounded (e.g.
  admin request lists, resource hub listing) — worth confirming per-endpoint
  and adding limit/offset or cursor pagination where missing.
- Images served from Cloudinary (good) but no evidence of responsive image
  sizing/transformation parameters being used — likely shipping
  full-resolution images to every viewport.
- No compression middleware (`compression`) on the Express app — text
  responses (JSON, and the CSS/JS the frontend serves during SSR-less static
  hosting isn't Express's concern, but API JSON is) aren't gzipped at the
  app level, though Vercel/Railway may add this at the platform layer
  already — worth confirming rather than assuming.

---

## 10. Scalability

**Problems** (this section is inherently about what's *not* there yet)
- Socket.io is single-instance, in-memory — `io.on("connection")` joins a
  room keyed by `user:${socket.userId}` with no adapter (e.g. Redis) backing
  it. Fine at current scale; would break the moment the backend runs as more
  than one process/instance, since a notification emitted from instance A
  wouldn't reach a socket connected to instance B.
- No caching layer (Redis or similar) for anything except the one
  MySQL-table-backed AI content cache — session data, rate-limit counters
  (currently in-memory per `express-rate-limit` default store), and
  frequently-read/rarely-written data (course catalog) all hit MySQL or
  live in single-process memory, which doesn't survive a restart or scale
  across instances.
- No containerization (no `Dockerfile`/`docker-compose.yml`) — local dev
  parity depends on each developer's machine matching Node/MySQL versions by
  hand, which this project's own session history shows caused real friction
  (case-sensitivity differences between Windows dev and Linux prod builds).
- No queue/background-job system — report generation
  (`utils/reportScheduler.js`) and email sending run inline in the request
  process; fine at current volume, worth naming as a deliberate "not yet
  needed" rather than an oversight if asked.

---

## 11. Maintainability & Code Quality

**Strengths**
- Consistent error handling pattern end to end.
- 37 automated tests covering the highest-risk logic (auth business rules,
  the SSRF guard, validation schemas) with the repository layer mocked —
  genuinely fast, deterministic unit tests, not integration tests disguised
  as unit tests.
- ESLint is clean (0 errors) with a CI workflow enforcing lint + test +
  build on every push.
- Comments throughout the codebase explain *why*, not *what* — e.g. every
  schema migration function has a comment explaining the historical reason
  it exists, which is exactly the right instinct for a comment.

**Problems**
- Backend test coverage is unit-only — no integration tests against a real
  (even if ephemeral/containerized) test database, so a bug in the raw SQL
  itself (a typo in a column name, a join that silently returns wrong rows)
  wouldn't be caught by the current suite, since repositories are mocked
  away in every service test.
- Frontend test coverage is narrow by design (2 utility modules + 2
  components) — no page-level tests, no coverage of the data-fetching
  pages that are also the most duplicated/inconsistent code (see React
  Architecture section) — likely the same refactor (extracting hooks/a
  shared service layer) would make those pages testable for the first time.
- No JSDoc/TypeScript types anywhere — every function's expected shape is
  implicit. Not necessarily wrong for a project this size, but worth a
  deliberate decision on whether to introduce incrementally.
- Dead files (listed under Folder Structure) are a real, if small,
  maintainability tax — anyone reading the repo cold has to figure out
  `ResourceCard.jsx` vs `Resoursecard.jsx` is a typo, not two intentional
  variants.

---

## 12. Error Handling

**Strengths**
- The `AppError` + `asyncHandler` + central error middleware pattern is
  applied with zero exceptions across every controller checked.
- Frontend has a global `ErrorBoundary` (this session) and the `apiClient`
  Axios interceptor normalizes every backend error into a consistent
  `Error` with a readable message.
- 404s are JSON, not HTML, for every `/api/*` route that doesn't match —
  deliberate, not accidental (explicit comment + catch-all route in
  `index.js`).

**Problems**
- Pages still using `utils/api.js` directly implement their own ad hoc
  try/catch/error-state handling per call site instead of relying on a
  shared pattern — inconsistent with the more disciplined `apiClient`-based
  pages.
- Backend swallow-and-log patterns in the bootstrap migration code
  (`console.error("⚠️ Schema migration warning:", ...)`) mean a failed
  `ALTER TABLE` doesn't stop the server or surface anywhere an operator
  would see it in production — it's genuinely just a log line, easy to
  miss in a hosted platform's log stream.
- No centralized frontend error reporting (Sentry or equivalent) — errors
  caught by `ErrorBoundary` or the Axios interceptor currently only reach
  `console.error`, invisible once deployed.

---

# Prioritized Roadmap

Ordered by risk/impact within each phase, not by ease. Phase 1 items are
things that could cost you money, get exploited, or actively confuse an
interviewer reading the code cold. Later phases are progressively more
"nice to have, shows senior judgment" rather than "must fix."

## Phase 1 — Critical

1. **Rate-limit and gate the AI endpoints.** Add a dedicated limiter for
   `/api/ai/*` (tighter than the auth limiter, since Gemini calls cost real
   money per request) and decide deliberately whether `/api/ai/search-assist`
   should require auth or just rate limiting — right now it has neither.
2. **Fix the unawaited schema migrations in `index.js`.** Await
   `ensureExtendedLearningSchema`, `ensureRoleModel`, `ensureAuthColumns`,
   and `ensureResourcesColumns` (convert their callback-style `db.query`
   calls to `queryAsync`) before the server starts listening, closing the
   cold-boot race condition.
3. **Wire up `ADMIN_JWT_SECRET` for real, or remove it.** Given the
   privilege gap between admin and student tokens, actually separating the
   signing secret is the right call — small change, meaningful hardening.
4. **Delete the five dead/duplicate frontend files** (`Resoursecard.jsx`,
   `UploadResoursePage.jsx`, `Profile.jsx`, `CourselistPage.jsx`,
   `Adminpanelpage.jsx` + its dead import in `App.jsx`). Zero risk, and it's
   the fastest possible win against "this doesn't look professionally
   maintained."
5. **Add a `/api/health` endpoint** — checks DB connectivity, returns
   200/503 accordingly. Trivial to add, expected by any real hosting
   platform, and directly useful for Railway's own health checks.

## Phase 2 — Important

1. **Unify frontend API access behind one pattern.** Migrate every page
   still using `utils/api.js` directly onto the `apiClient`-based service
   layer, adding the missing service modules (a `courseService.js`,
   `dashboardService.js`, `adminRequestService.js`, etc.) so no page talks
   to `fetch`/`apiCall` directly. Delete `utils/api.js` once nothing
   references it.
2. **Introduce a server-state library (TanStack Query).** This is the
   single highest-leverage frontend change available: it replaces the
   duplicated fetch/loading/error boilerplate across every page, adds
   caching and request deduplication for free (fixing the duplicate
   unread-count fetch between `NotificationBell` and `NotificationsPanel`),
   and makes the data-fetching pages meaningfully easier to test.
3. **Introduce a real migration tool** (e.g. `node-pg-migrate`-style
   numbered SQL files, or a lightweight MySQL migration runner) and port the
   existing `ensure*` functions into versioned migration files. This
   replaces "300 lines of imperative schema-checking in the app entrypoint"
   with an auditable, ordered history.
4. ~~**Resource-model consolidation plan.**~~ **Done — the `resources` table
   was confirmed dead (no write path anywhere) and removed entirely**,
   rather than documented as a deliberate third model. See the Database
   Design section above for what was actually found and removed.
5. ~~**Add `npm audit` (or Dependabot) to CI.**~~ **Done.** Scoped to
   production dependencies at high/critical severity so it's a real gate,
   not a performative one — see the Security section above for the two
   known findings it deliberately doesn't block on yet.
6. ~~**Add pagination to list-heavy endpoints.**~~ **Done** for the three
   named (course catalog, resource hub listing, admin request list) - real
   `page`/`pageSize` query params (validated, capped at 100/page), a
   `COUNT(*)` alongside the `LIMIT/OFFSET` query, and a consistent
   `{ items, pagination: { page, pageSize, total, totalPages } }` envelope.
   The course catalog and resource hub pages request the max page size to
   preserve their current "browse everything, filter client-side" UX rather
   than needing a client-side filtering rework in the same change; the admin
   request list (no competing client-side filter logic, and the one most
   likely to actually accumulate rows an admin needs to page through) got
   real Previous/Next controls. Response caching (e.g. `Cache-Control`
   headers) is still open - pagination was the higher-value half of this
   item and caching is a separable concern.
7. ~~**Generate an OpenAPI spec from the existing Zod schemas.**~~ **Done.**
   `@asteasolutions/zod-to-openapi` extracts request schemas (body/params/
   query) directly from the existing `validation/*.js` files - all 74
   endpoints across every route file are registered, served live at
   `/api/docs` (Swagger UI) and `/api/openapi.json`, plus `npm run openapi`
   for a static export. Response bodies are deliberately left undocumented
   beyond status codes, since this codebase's Zod schemas validate requests
   only - documenting a response contract the API doesn't actually enforce
   would be inventing, not generating.

## Phase 3 — Advanced

1. **Structured logging** (Pino or Winston) with request IDs, replacing
   emoji `console.log`, so log output is actually queryable in a hosted
   platform's log viewer.
2. **Integration tests against a real (containerized) test database** —
   the natural next layer above the current mocked-repository unit tests,
   catching bugs the mocks can't (bad joins, wrong column names).
3. **Dockerize local dev** (`Dockerfile` for the backend, `docker-compose.yml`
   wiring it to a MySQL container) — removes the Windows/Linux environment
   drift that already caused two real bugs this project hit in production
   (case-sensitivity, CSS bundling order).
4. **Extract shared data-fetching logic into custom hooks**, enabled by the
   Phase 2 TanStack Query migration — turns "every page repeats this" into
   "every page calls `useCourses()`."
5. **Consistent design-token usage pass** — replace hardcoded
   colors/radii/spacing across the ~40 CSS files with the tokens `theme.css`
   already defines, rather than introducing new ones.
6. **Account-level brute-force protection** (lock/delay after N failed
   attempts on a specific account, independent of source IP).
7. **Decide on TypeScript** (or at minimum JSDoc type annotations on service
   function signatures) — biggest maintainability lever available, also the
   most expensive; worth scoping as an incremental, file-by-file migration
   rather than a rewrite.

## Phase 4 — Production Quality

1. **Frontend error reporting** (Sentry or equivalent) so `ErrorBoundary`
   catches and production JS errors are actually visible somewhere, not just
   `console.error` into the void.
2. **CI/CD deploy automation** — extend the existing GitHub Actions workflow
   (currently lint/test/build only) to actually deploy to Vercel/Railway on
   merge, rather than manual dashboard clicks.
3. **Process supervision for uncaught exceptions** — exit deliberately on
   `uncaughtException` and let the hosting platform restart the process,
   instead of continuing to run in a possibly-corrupted state.
4. **Refresh-token flow** for session renewal without an abrupt 1-hour
   logout.
5. **Evaluate httpOnly-cookie-based auth** as a deliberate trade-off
   discussion (CSRF protection cost vs. XSS token-theft risk) — a genuine
   architecture decision worth having an documented opinion on, not
   necessarily worth implementing given the migration cost relative to this
   project's actual threat model.
6. **Socket.io horizontal-scaling readiness** (Redis adapter) — only
   matters the moment the backend runs as more than one instance, but worth
   knowing the one-line fix (`@socket.io/redis-adapter`) if asked.
7. **API versioning strategy**, decided deliberately rather than left
   implicit, before any external consumer depends on the current shape.

---

## How to use this document

Each Phase 1 item is small enough to be its own commit, matching this
project's existing commit-message discipline (see `git log`). Recommend
tackling Phase 1 in full before starting Phase 2 — several Phase 2 items
(the TanStack Query migration, the API service-layer unification) touch a
lot of files and are easier to review cleanly against a codebase that isn't
also carrying known Phase-1-level issues.

Nothing in Phase 3 or 4 is required to call this project interview-ready —
it already isn't a "typical university student" project after this session's
work (tests, CI, accessibility, code-splitting, a real security fix with a
documented root cause). Phases 3–4 are what separate "solid" from "the
candidate clearly thinks about this stuff by default," which is worth
having in your back pocket for follow-up questions even if not all of it
gets implemented before an interview.
