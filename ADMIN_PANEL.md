# Admin panel delivery

Source of truth: `Project_Context.md`, especially sections 4, 6.3–6.10 and 16.

## Workspace and startup

- Chat: `admin:3500`; branch: `admin`; port: `3500`.
- Checkout: `F:\Jahan Academy\.worktrees\admin`.
- Run `pnpm dev:admin` from `frontend`. The launcher verifies the branch before starting.
- Opening `http://localhost:3500` redirects to `/admin` only when launched with `JAHAN_PANEL=admin`.
- The local, ignored `frontend/.env.local` sets `ADMIN_API_URL=http://127.0.0.1:8080` to reuse the existing Docker backend. Set this variable for other installations; default is `http://127.0.0.1:8000`. Either a server origin or an origin ending in `/api/v1` is accepted.
- No credentials, new accounts, database migrations or backend authorization changes are included.

## Requirement and design

The panel uses existing server-side permissions and resource scoping. It provides email/password login, password recovery, a temporary local reporting dashboard, lead detail/edit/assignment/status/history/archive/Noura retry, bilingual university and Program forms, content/FAQ/taxonomy forms, media upload and metadata, reference data, staff lifecycle/roles/recovery, and read-only audit records.

Read access and mutations are always checked by the existing backend. A visible navigation item is not a grant. Unavailable permissions produce an explicit denial. Lists have search, supported filters, server pagination, empty/error/loading states, and refresh. List filters survive navigation within the open panel. No Program data is exposed on public routes.

Replacement forms translate read-side relations back to write-side IDs and preserve existing structured requirement values and author associations. ETags use each detail record's version for optimistic writes. Failed detail reads disable saving. Unsaved edits require confirmation before closing, and warn before a tab reload. Lifecycle actions cannot run over unsaved edits. Permanent deletion is not offered.

The dedicated `/admin/api/*` bridge has a fixed environment-selected backend, an administrative/authentication route allowlist, same-origin checks on mutations, no-store responses, timeout handling, and scoped refresh cookies. Access tokens stay in memory. Refresh calls are coalesced to prevent concurrent token-family rotation in React Strict Mode. Backend CSRF validation still runs. Passwords and tokens are not stored in localStorage/sessionStorage. Admin metadata is noindex.

## Validation

- Frontend TypeScript and unit tests, including admin API/session/concurrency/serialization regression tests.
- Production Next.js build.
- Thirteen create-form payloads checked against the actual Pydantic backend schemas (universities, Programs, articles, FAQs, categories, tags, authors, and six reference-data kinds).
- `node scripts/verify-admin-http.mjs` verifies the live panel and real API authorization boundary; requires the dev server and configured backend.
- Browser refresh and desktop/mobile login inspection.
- No migration tests apply: no schema change. No new backend permission design applies: existing permissions are reused.

## Remaining acceptance dependencies

- The existing API and database/Redis readiness were verified through port 8080. The owner has no available admin login, so authenticated end-to-end create/edit/publish/assignment/upload and role-matrix UAT remain unverified. No administrator was created or impersonated.
- The running Docker API is older than this checkout: its OpenAPI document omits `/admin/staff`, `/reporting/dashboard`, and `/admin/audit-logs`. These return 404 in the current local environment. Rebuilding the shared backend and applying its migrations requires a separate instruction; this panel does not mutate the shared deployment.
- Existing backend gaps relative to the source of truth remain: no standalone internal lead-note endpoint; the Program router has no tuition-descending sort; general homepage/static-page CMS editing is not exposed by this checkout's administration APIs. These require separately authorized shared/backend work.
- Reference selectors currently use explicit record IDs; copy IDs from detail views. Structured existing Program requirement values are preserved but not edited by this first UI.
- Real Noura integration remains an external dependency. This panel invokes the existing mock-capable backend retry workflow.
- Media upload depends on the backend's signed storage URL being reachable from the browser and its storage CORS configuration.
- Full role-aware navigation, accessible end-to-end audits, and authenticated browser workflows should be accepted with real administrative accounts before deployment. The backend remains authoritative meanwhile.
- No merge to `develop` or production deployment is included. The owner merges feature PRs.
