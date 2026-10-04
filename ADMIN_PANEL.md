# Admin panel delivery

Source of truth: `Project_Context.md`, especially sections 4, 6.3–6.10 and 16.

## Per-user section access — 2026-10-04

Supersedes the consultation-only navigation restriction below. Global super administrators see all implemented sections and a dedicated access-management screen. Other staff default to consultations; super administrators use per-user checkboxes and an explicit Save action to grant or revoke the other sections. Staff administration, access management and audit logs remain super-admin-only. An explicitly empty selection means no panel access.

The API loads access from `staff_panel_access` on every request, checks the specific section as well as operation permissions, and preserves assigned-lead scoping for consultants. Changes use the staff row version / `If-Match`, a row lock and an audit event. The frontend fetches its own access after login and refreshes it every ten seconds and on focus; failure closes the protected view. No permission decisions are stored in browser storage.

Endpoints: `GET /users/me/panel-access`; super-admin-only `GET` and `PUT /admin/staff/{id}/panel-access`. The latter accepts `{ "sections": [...] }` and requires `If-Match`. Unknown, duplicate and reserved sections are rejected. Super-admin section access cannot be edited, including by the same account.

Migration: `024_panel_access`, based on `023_admin_dashboard_reporting`. The existing shared local database also has the sibling `024_public_experience_cms` revision from `origin/codex/public-experience-cms`. Local startup used both authentic migration files in a temporary Alembic directory and `upgrade heads`, preserving both heads and all CMS tables. Future integration of that CMS branch must include an Alembic merge revision before deploying a single-head migration graph.

The admin-only local API runs in `jahan-admin-access-api` at `127.0.0.1:18080`, using the existing local database and infrastructure on the application and edge Docker networks. The ignored `frontend/.env.local` points `ADMIN_API_URL` there; the panel stays on `localhost:3500`. The API at port 8080 also received the updated identity module (with a local backup) and was restarted to enforce section restrictions across both entry points; its other modules retain their existing version. The admin container mounts this checkout's backend source read-only; restart it after backend edits. These container changes are local development configuration and must be included in a normal image deployment before recreating the shared container. This is not a production deployment.

Validation: 122 backend tests including real-session grant/revoke integration against an isolated migrated PostgreSQL database; migration downgrade/re-upgrade; Ruff formatting/lint and mypy; frontend unit tests, TypeScript and production build. The actual `Amin` session was refreshed on port 3500 and showed all 19 sections and the access-management screen, including protected full super-admin access. Existing missing domain features listed below are not claimed as completed by this permission feature.

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

## Login redesign and local account — 2026-10-03

The owner's approved update replaces the login with a sky/aircraft background, white/navy split card, official Jahan Academy branding, required username/password controls, and an accessible password-visibility button. Recovery remains email-based.

The local `Amin` username is configured by the ignored `ADMIN_LOCAL_USERNAME` and `ADMIN_LOCAL_EMAIL` server variables. The adapter enables this alias only in Next.js development mode and delegates actual credential verification to the backend. Existing email identities remain supported. This is a temporary local alias, not a change to the production email identity contract or the global password policy.

The requested local account was provisioned as active and verified, with an Argon2 password hash, a global `super_admin` grant, and a `staff.local_bootstrap` audit event. The password is not included in repository files. The reusable local provisioning script accepts process environment values, refuses non-local environments, uses a reserved example.com identity, and never overwrites an existing account. No migrations or backend rebuild were performed.

Live login, authenticated identity/lead/Program reads, and logout were tested successfully. This supersedes the earlier statement that no local admin account is available. Full CRUD and the previously listed backend-version gaps remain outside this login update.

## Consultation inbox — 2026-10-04

Current owner-approved scope exposes only consultation requests after login. Other resource implementations remain dormant and are not offered in navigation. Both the public consultation form and initial-assessment form persist through the existing consultation endpoint and appear in the same newest-first table.

- Table: reference, full name, mobile, email, country (including free-text destinations), status, assignee, localized timestamp and Noura synchronization state. Search, status/sync/archive filters, pagination and existing version-protected detail operations remain available. Assessment education, budget and language answers retain their existing message representation and are visible in details.
- Visible/online inboxes refresh every two seconds after each completed request. Requests are serialized; updates preserve open editors; request cancellation prevents stale filter responses. Failed requests keep previous results with a visible warning and back off to 30 seconds. Returning online or to the tab triggers a refresh. This is near-real-time polling, not server push. Active filters/pagination can exclude new requests and the UI explains how to return to the full first page.
- The owner explicitly approved the shared next.config.ts change. Only /api/v1/consultation-requests is forwarded to the configured backend, resolving the missing same-origin route for public form submission. Use ADMIN_API_URL or API_INTERNAL_URL for that deployment; the default is localhost:8000. The admin's ignored local configuration targets localhost:8080.
- Existing backend persistence, deduplication and permission checks remain authoritative. No schema, authentication or permission changes; migration testing does not apply. Duplicate submissions retain the backend's existing reference behavior.
- Verification: 84 frontend tests, TypeScript, production build and HTTP authorization checks pass. In the browser, both a synthetic consultation and a submission through the actual assessment form appeared without manually refreshing the inbox. Assessment details, search and refresh persistence were checked. The two synthetic records were then archived by their exact references, preserving the test audit trail without leaving active leads. Noura was confirmed to target the local mock service.
- Existing missing backend capabilities (notably standalone internal notes) remain outside this table/submission scope. This change does not claim full CRM acceptance or merge into develop.

## Site palette alignment — 2026-10-04

Admin-only CSS now uses the current home-page palette from frontend/app/home.css: brand blue #123B78, silver #AEB7C2, canvas #F7F8FA, text #202833 and muted text #66717F. Scoped tokens cover navigation, tables, controls, dialogs, live-update indicators and login. Success/warning/error colors retain their semantic meaning; the existing login artwork is preserved.

Validation: production build (including TypeScript), browser refresh on localhost:3500, visual inspection of the request table/sidebar/login, and contrast calculations for body, muted, primary, selected and semantic text (all at least 4.5:1). No new unit tests, API/permission design, migrations or data integration tests apply because this update changes CSS colors only. Existing behavior is covered by CI.
