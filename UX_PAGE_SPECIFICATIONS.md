# Jahan Academy — UX Page Specifications

> **Version:** 1.0
> **Scope:** MVP v1
> **Date:** September 22, 2026
> **Source of truth:** [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
> **SRS:** [SRS.md](./SRS.md)
> **User journeys:** [USER_JOURNEYS.md](./USER_JOURNEYS.md)
> **Information architecture:** [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)

## 1. Purpose and Scope Boundary

This document defines the required UX anatomy and states of every MVP public and administrative page. Each specification covers:

- Page goal.
- User intent.
- Components.
- Calls to action.
- Navigation.
- Form fields.
- Error, empty, loading, and success states.
- Mobile behavior.

`Course`, Instructor, Curriculum, Reviews, and Related Courses are not MVP entities. The approved equivalent is an academic **Program** offered by a university. Its detail page includes Program Header, description, university, academic level, field, duration, tuition, application fee, teaching language, intakes, deadlines, admission requirements, FAQs, contextual consultation CTA, and related navigation. Public reviews are not approved for MVP.

## 2. Global UX Rules

### 2.1 Public shell

- Header contains logo/Home, Countries, Services, Universities, News/Articles, About, Contact, locale switcher, search/discovery access, and the primary free-consultation CTA.
- Footer contains Discovery, Information, Support, Legal, verified organization/contact information, locale control, and approved social links.
- Persian is fully RTL; English is fully LTR. Layout and directional icons mirror without changing semantic keyboard order.
- Breadcrumbs appear on nested pages and match structured data.
- Public content never requires authentication in MVP.

### 2.2 Global CTA hierarchy

1. **Primary:** `درخواست مشاوره رایگان` / `Request Free Consultation`.
2. **Secondary:** View details, explore universities/Programs, read article, reset filters, visit official source.
3. **Tertiary:** Language switch, breadcrumbs, related content, back navigation.

One visual primary action should dominate each viewport section. Destructive actions exist only in Admin and never use the primary brand style.

### 2.3 Shared form behavior

- Persistent label above every control; placeholder is an example, not a label.
- Required/optional state is explicit and localized.
- Client validation assists; server validation is authoritative.
- Errors appear beside the control and in a focusable summary when multiple errors exist.
- On submit, the primary action enters a disabled in-flight state and prevents accidental repeat submission.
- Non-sensitive user input survives recoverable failures.
- Keyboard focus moves to the error summary, first invalid control, or success heading as appropriate.

### 2.4 Shared public states

| State | Required behavior |
|---|---|
| Loading | Stable skeleton matching final layout; no large layout shift; critical hero image receives correct priority |
| Empty | Explain why no data is shown and provide recovery or consultation action |
| Recoverable error | Localized safe message, correlation/reference where useful, explicit retry |
| Not found | Localized 404 with Home, discovery, and consultation routes |
| Success | Confirm completed action, show next step, and avoid promising unavailable functionality |

### 2.5 Shared Admin shell

- Permission-filtered sidebar plus server authorization.
- Page header contains title, breadcrumb, contextual primary action, and optional safe secondary actions.
- Tables support search/filter/pagination and retain safe state when returning from detail.
- Statuses use text plus color/icon; color is never the sole indicator.
- Dirty forms warn before navigation.
- Destructive/archive/anonymize actions require clear consequences and confirmation.

## 3. Public Page Specifications

### PUB-01 — Homepage

**Route:** `/{locale}`

- **Page goal:** Explain Jahan Academy, direct visitors into discovery, build trust, and generate consultation requests.
- **User intent:** Understand what the service offers, explore study options, or ask for guidance.
- **Components:** Global header; hero; value proposition; consultation CTA; university/Program discovery entry; featured destinations; services; featured universities/Programs when configured; verified benefits/statistics; latest news; FAQ; consultation block; footer.
- **CTA:** Primary consultation CTA above the fold and near page end. Secondary CTAs: explore Programs, universities, countries, and articles.
- **Navigation:** Global navigation; section-level links; footer navigation. Logo returns Home.
- **Form fields:** No mandatory inline form. If the consultation form is embedded, use all fields from `PUB-13` without changing requirements.
- **Error states:** A failed optional section shows a contained retry or is omitted without breaking the page; global failure uses localized error page.
- **Empty states:** Hide unconfigured featured/FAQ/latest sections cleanly; discovery and consultation remain visible.
- **Loading states:** Hero shell renders first; card skeletons preserve dimensions; below-fold media lazy-loads.
- **Success states:** If an embedded consultation succeeds, show reference and next step in place or navigate to the form success state.
- **Mobile behavior:** Single-column section stack; touch-friendly cards; collapsible navigation; hero copy/CTA visible early; no auto-advancing carousel required.

### PUB-02 — Country Listing

**Route:** `/{locale}/countries`

- **Page goal:** Help visitors discover supported study destinations.
- **User intent:** Browse available countries before selecting a university or Program.
- **Components:** Breadcrumb; H1 and intro; country cards; optional featured grouping; pagination if required; consultation block.
- **CTA:** View country; explore universities; global consultation CTA.
- **Navigation:** Breadcrumb to Home; each card links to canonical country detail.
- **Form fields:** None.
- **Error states:** Localized load error with retry; global shell remains available.
- **Empty states:** Explain that destinations are being prepared and offer university/Program discovery plus consultation.
- **Loading states:** Responsive country-card skeleton grid.
- **Success states:** Successful load shows only Published countries.
- **Mobile behavior:** One- or two-column cards based on width; concise card content; images use fixed aspect ratio.

### PUB-03 — Country Detail

**Route:** `/{locale}/countries/{slug}`

- **Page goal:** Explain a destination and connect it to relevant institutions and Programs.
- **User intent:** Evaluate whether a country deserves deeper exploration.
- **Components:** Breadcrumb; country header/hero; bilingual overview; verified study guidance; related universities; related Programs when available; related articles/FAQs where configured; consultation CTA.
- **CTA:** Explore universities/Programs in this country; request consultation with country source context.
- **Navigation:** Back to country list; linked university/Program/article cards.
- **Form fields:** None unless consultation block is embedded; then follow `PUB-13`.
- **Error states:** Invalid/archived slug follows redirect/404/410 policy; related-section failure is contained.
- **Empty states:** If no related university/Program exists, explain that inventory is being prepared and offer consultation.
- **Loading states:** Header skeleton followed by card-section skeletons.
- **Success states:** Published localized content and valid relationships render with canonical/hreflang metadata.
- **Mobile behavior:** Single-column content; horizontal chip/compact card patterns only when accessible; CTA becomes full-width.

### PUB-04 — University Listing

**Route:** `/{locale}/universities?q={text}&page={number}`

- **Page goal:** Help users find and open a university profile.
- **User intent:** Search a named institution or browse available universities.
- **Components:** Breadcrumb; H1; optional intro; search field; result count; university cards/list; pagination; empty/error area; consultation block.
- **CTA:** View university details; clear search; request consultation.
- **Navigation:** Breadcrumb to Home; canonical card links; pagination updates URL.
- **Form fields:** `q` university-name search. Submit or debounced behavior must remain accessible and URL-backed.
- **Error states:** Search/list failure shows retry without clearing entered query.
- **Empty states:** No match message, current query, clear/reset action, and consultation CTA.
- **Loading states:** Search remains usable; result card skeletons and stable result region.
- **Success states:** Result count, Published results, and valid page controls appear.
- **Mobile behavior:** Full-width search; stacked cards; compact pagination; result summary announced to assistive technology.

### PUB-05 — University Detail

**Route:** `/{locale}/universities/{slug}`

- **Page goal:** Provide trusted institution information and route visitors to Programs or consultation.
- **User intent:** Evaluate the university and understand available study options.
- **Components:** Breadcrumb; University Header; name/logo/hero/gallery; city/country; institution type; founding year when known; overview; official website/contact when supplied; published Programs; FAQs; related news; consultation block.
- **CTA:** Primary contextual free consultation. Secondary: view Program, visit official website, view country.
- **Navigation:** Breadcrumb to university list; country link; Program links; related article links; in-page anchors may be used for long pages.
- **Form fields:** None unless contextual consultation is embedded. Trusted university ID is hidden/system-owned and its name may be shown read-only.
- **Error states:** Missing/archived page follows URL policy; failed gallery/related sections degrade independently; broken media uses safe fallback.
- **Empty states:** Omit unknown optional facts; show a useful no-Programs message with consultation CTA when none are Published.
- **Loading states:** Header/hero skeleton with fixed dimensions; related Program skeletons.
- **Success states:** All available verified facts render; official link is visibly external; contextual CTA carries correct university ID.
- **Mobile behavior:** Header facts wrap into cards/rows; gallery is swipeable only with accessible controls; sticky bottom CTA may be used without hiding content.

### PUB-06 — Program Listing

**Route:** `/{locale}/programs?q={text}&level={code}&field={slug}&intake={code}&sort={value}&page={number}`

- **Page goal:** Enable efficient academic Program discovery.
- **User intent:** Find Programs matching level, field, intake, and tuition preference/order.
- **Components:** Breadcrumb; H1/intro; text search; filter controls; active filter chips; reset; result count; sort; Program cards/list; pagination; consultation block.
- **CTA:** View Program details; apply/reset filters; request consultation.
- **Navigation:** URL is the source of list state; Program cards use canonical links; browser Back restores state.
- **Form fields:** Search query; academic level; field of study; intake; sort. Page is system-controlled.
- **Error states:** Invalid filter is ignored safely; request failure offers retry and retains valid URL state.
- **Empty states:** Explain no match; show active filters; remove one/reset all; offer consultation.
- **Loading states:** Existing controls remain stable; results use card skeletons; filter changes announce loading/results.
- **Success states:** Active filters, accurate result count, maximum 20 results, valid pagination, and correct tuition ordering.
- **Mobile behavior:** Search and sort remain visible; filters open in accessible drawer/sheet with Apply and Clear actions; active chips scroll/wrap safely; results stack.

### PUB-07 — Program Detail

**Route:** `/{locale}/programs/{slug}`

- **Page goal:** Present all decision-critical Program information and convert high-intent visitors to consultation.
- **User intent:** Determine whether a Program is relevant, affordable, timely, and worth discussing.
- **Components:** Program Header; title; linked university; country/city; academic level; field of study; summary; full description; tuition; application fee; duration; teaching language; intakes; deadlines; admission requirements; official source; FAQs; related university/Program navigation where approved; contextual consultation CTA.
- **CTA:** Primary contextual consultation. Secondary: visit official source, view university, explore related Programs.
- **Navigation:** Breadcrumb Home → Programs → Program; linked university/country; optional in-page anchor navigation for long content.
- **Form fields:** None unless consultation is embedded. Trusted Program and university IDs are system-owned and displayed read-only where useful.
- **Error states:** Missing/archived slug follows redirect/404/410; unavailable optional field is omitted or labeled unknown—not fabricated; related content failure is contained.
- **Empty states:** No FAQ/related Programs section is hidden or replaced with discovery CTA; `Contact us` is shown for non-numeric tuition.
- **Loading states:** Stable header/fact skeleton; long content and related sections load without layout jump.
- **Success states:** Verified structured facts, appropriate tuition mode, intake-specific deadline, canonical/hreflang/eligible schema, and valid contextual CTA.
- **Mobile behavior:** Key facts appear early in stacked summary cards; wide tables become labeled rows/cards; primary CTA becomes full-width or safe sticky action; official link remains accessible.

### PUB-08 — News Listing

**Route:** `/{locale}/news?page={number}`

- **Page goal:** Expose current educational-migration content and build trust/organic acquisition.
- **User intent:** Browse recent news and guidance.
- **Components:** Breadcrumb; H1/intro; featured/latest article when configured; article cards; publication dates; pagination; consultation CTA.
- **CTA:** Read article; request consultation.
- **Navigation:** Article canonical links; pagination; global discovery routes.
- **Form fields:** None in MVP.
- **Error states:** List failure offers retry.
- **Empty states:** Explain that articles are being prepared and offer discovery/consultation.
- **Loading states:** Featured/card skeletons with reserved image dimensions.
- **Success states:** Published articles ordered by publication date descending.
- **Mobile behavior:** One-column cards; concise summaries; predictable image ratios and tap targets.

### PUB-09 — Article Detail

**Route:** `/{locale}/news/{slug}`

- **Page goal:** Inform users, establish expertise, and connect content to relevant discovery or consultation.
- **User intent:** Read and understand a specific topic.
- **Components:** Breadcrumb; title; summary; author/date; featured image; semantic article body; inline verified links; related/latest articles; relevant consultation CTA.
- **CTA:** Topic-relevant consultation; related article/entity navigation.
- **Navigation:** Breadcrumb to News; contextual internal links; related content.
- **Form fields:** None.
- **Error states:** Missing/archived article follows URL policy; unavailable related content does not break body.
- **Empty states:** Related section hides when empty; article body cannot publish empty.
- **Loading states:** Article header and body skeleton; featured image space reserved.
- **Success states:** Readable localized content, correct author/date, social metadata, canonical/hreflang, and eligible Article schema.
- **Mobile behavior:** Comfortable reading width, scalable typography, responsive media, accessible tables/code if present, and non-obstructive CTA.

### PUB-10 — Services

**Route:** `/{locale}/services`

- **Page goal:** Explain what Jahan Academy can help with in the MVP and distinguish future services.
- **User intent:** Understand service fit before making contact.
- **Components:** Breadcrumb; page header; service cards/sections; process overview; eligibility/disclaimer text; FAQs where configured; consultation CTA.
- **CTA:** Request free consultation; explore Programs/universities.
- **Navigation:** Links to relevant discovery/content pages and policies.
- **Form fields:** None unless the consultation component is embedded.
- **Error states:** General localized error with retry/recovery.
- **Empty states:** Page cannot be Published without required bilingual content.
- **Loading states:** Header and service-section skeletons.
- **Success states:** Approved bilingual service descriptions without claiming unavailable booking/application/payment workflows.
- **Mobile behavior:** Stacked service cards and step list; CTA full-width.

### PUB-11 — About

**Route:** `/{locale}/about`

- **Page goal:** Establish identity, credibility, values, and trust.
- **User intent:** Verify who is behind the service and whether it is credible.
- **Components:** Breadcrumb; mission/story; values; approved team/credentials if supplied; verified statistics only; contact link; consultation CTA.
- **CTA:** Contact us; request consultation; explore services.
- **Navigation:** Services, Contact, Privacy, Terms.
- **Form fields:** None.
- **Error states:** General localized error with recovery.
- **Empty states:** Optional team/statistics modules hide when not approved.
- **Loading states:** Text-first skeleton; media reserves dimensions.
- **Success states:** Clear organization identity and only approved claims/assets.
- **Mobile behavior:** Linear narrative; readable text width; images stack with captions/alt text.

### PUB-12 — Contact

**Route:** `/{locale}/contact`

- **Page goal:** Provide verified contact channels and route consultation intent correctly.
- **User intent:** Contact Jahan Academy, find organizational details, or request advice.
- **Components:** Breadcrumb; verified phone/email/address/hours where supplied; map only if approved; consultation CTA; optional contact form only if it reuses lead infrastructure.
- **CTA:** Primary free consultation; secondary approved phone/email links.
- **Navigation:** Privacy, Terms, Services, About.
- **Form fields:** No separate workflow by default. If enabled as P1, reuse consultation fields and lead processing rather than creating a disconnected inbox.
- **Error states:** Failed optional map does not block contact data; contact-form errors follow `PUB-13`.
- **Empty states:** Unknown contact channel is omitted; do not show placeholder details.
- **Loading states:** Contact information should be server-rendered where possible; optional map loads progressively.
- **Success states:** Clickable validated contact actions or consultation confirmation.
- **Mobile behavior:** Phone/email targets are large; address wraps; CTA full-width; map never dominates initial viewport.

### PUB-13 — Free Consultation

**Route:** `/{locale}/consultation` and reusable contextual component

- **Page goal:** Convert an interested visitor into a durable, qualified consultation lead.
- **User intent:** Ask for personalized guidance without creating an account.
- **Components:** Header/title; reassuring summary; optional read-only source context; responsive form; required/optional explanation; Privacy/Terms links; full-width submit; validation summary; success/reference panel.
- **CTA:** `ثبت درخواست مشاوره` / `Submit Consultation Request`.
- **Navigation:** Global shell; safe back/context link; Privacy and Terms open without losing form state when possible.
- **Form fields:** First name; last name; required mobile; optional email; desired country; intake (`Spring`, `Summer`, `Fall`, `Winter`, `Unknown`); start year; optional age 18–100; optional gender including Prefer not to say; optional occupation; optional marital status including Prefer not to say; optional investment/budget range; budget currency; optional message; required privacy consent; required contact consent; trusted hidden source URL/entity IDs and locale.
- **Error states:** Field-level and summary validation; invalid age/mobile/consent messages; rate-limit/duplicate/network/server errors use safe localized copy; recoverable error preserves non-sensitive fields; no raw Noura error is shown.
- **Empty states:** Not applicable to the form. Unavailable source context is simply absent; desired country may allow configured unknown/free-text behavior.
- **Loading states:** Initial option lists show bounded skeleton/disabled controls; submission disables CTA and shows progress without erasing values.
- **Success states:** New request returns success and random public reference; duplicate returns existing reference and safe already-received message; both explain expected staff contact and that no public tracking portal exists in MVP.
- **Mobile behavior:** One-column controls in logical order; labels remain above fields; native-friendly inputs; full-width CTA; no keyboard-covered errors; source summary stays compact.

### PUB-14 — Privacy Policy

**Route:** `/{locale}/privacy`

- **Page goal:** Explain collected data, purposes, consent, retention, sharing, and data-subject rights.
- **User intent:** Decide whether to trust the service or understand a prior consent.
- **Components:** Breadcrumb; effective/version date; structured policy sections; contact/data-request instructions; related Terms link.
- **CTA:** Contact regarding privacy; return to consultation only as a secondary action.
- **Navigation:** Terms, Contact, Home; consultation form links here.
- **Form fields:** None.
- **Error states:** General localized error; policy should be server-rendered and highly available.
- **Empty states:** Cannot publish without complete bilingual content and version/effective date.
- **Loading states:** Text skeleton only when necessary.
- **Success states:** Current policy is readable, linkable, and version-identifiable.
- **Mobile behavior:** Table of contents may collapse; long paragraphs use readable width and spacing.

### PUB-15 — Terms and Conditions

**Route:** `/{locale}/terms`

- **Page goal:** Explain service terms, limitations, user obligations, and disclaimers.
- **User intent:** Understand conditions before consenting or using the service.
- **Components:** Breadcrumb; effective/version date; structured terms; disclaimers; contact route; Privacy link.
- **CTA:** Contact for questions; secondary return to consultation.
- **Navigation:** Privacy, Contact, Home.
- **Form fields:** None.
- **Error states:** General localized error.
- **Empty states:** Cannot publish incomplete bilingual terms.
- **Loading states:** Text skeleton only when necessary.
- **Success states:** Current terms are readable and version-identifiable.
- **Mobile behavior:** Collapsible table of contents if long; headings and anchor targets remain accessible.

### PUB-16 — Localized 404

**Route:** Unmatched locale-aware public URL

- **Page goal:** Recover users from a missing or removed page.
- **User intent:** Find the intended content or return safely.
- **Components:** Clear 404 heading; short explanation; Home; Programs; Universities; News; consultation CTA; optional search access.
- **CTA:** Go Home or explore discovery; consultation is secondary.
- **Navigation:** Global header/footer remain available where safe.
- **Form fields:** Optional search entry only if wired to a real discovery route.
- **Error states:** The 404 is itself the terminal missing state and must return the correct status.
- **Empty states:** Not applicable.
- **Loading states:** None beyond normal shell.
- **Success states:** User selects a recovery route.
- **Mobile behavior:** Centered concise content with large recovery actions.

### PUB-17 — General Error

**Route:** Framework error boundary

- **Page goal:** Contain unexpected failure and help the user recover without exposing internals.
- **User intent:** Retry or navigate to a safe page.
- **Components:** Localized message; retry; Home; optional correlation ID; global shell when safe.
- **CTA:** Retry. Secondary: Home or Contact.
- **Navigation:** Only safe stable routes.
- **Form fields:** None.
- **Error states:** Never display stack traces, SQL/provider details, secrets, or raw personal data.
- **Empty states:** Not applicable.
- **Loading states:** Retry enters brief progress state.
- **Success states:** Requested view recovers or user reaches a safe destination.
- **Mobile behavior:** Simple single-column layout with full-width recovery actions.

## 4. Administrative Authentication Pages

### AUTH-01 — Admin Sign In

**Route:** `/admin/sign-in`

- **Page goal:** Establish a secure administrative session.
- **User intent:** Access authorized panel tasks.
- **Components:** Logo/product label; sign-in card; email; password; show/hide password; submit; forgot-password link; generic security feedback.
- **CTA:** Sign in. Secondary: Forgot password.
- **Navigation:** No public admin registration; optional safe link to public Home.
- **Form fields:** Required email; required password; optional remember-session only if securely approved.
- **Error states:** Generic invalid credentials; inactive/locked response without account enumeration; five failures lock for 15 minutes; rate-limit feedback.
- **Empty states:** Not applicable.
- **Loading states:** Submit disabled with progress; prevent duplicate authentication requests.
- **Success states:** Redirect to authorized dashboard or safe originally requested Admin route.
- **Mobile behavior:** Centered single-column card; correct keyboard types; no horizontal overflow.

### AUTH-02 — Forgot Password

**Route:** `/admin/forgot-password`

- **Page goal:** Start password recovery without revealing account existence.
- **User intent:** Receive a reset link.
- **Components:** Explanation; email field; submit; return to sign in.
- **CTA:** Send reset link.
- **Navigation:** Sign in.
- **Form fields:** Required email.
- **Error states:** Invalid format or rate limit; response remains enumeration-safe.
- **Empty states:** Not applicable.
- **Loading states:** Disabled submit and progress.
- **Success states:** Always show a neutral “if an eligible account exists” message.
- **Mobile behavior:** Single-column card and email keyboard.

### AUTH-03 — Reset Password

**Route:** `/admin/reset-password?token={opaque}`

- **Page goal:** Set a new password using a valid single-use token.
- **User intent:** Regain account access.
- **Components:** New password; confirm password; requirements; submit; sign-in link.
- **CTA:** Set new password.
- **Navigation:** Sign in.
- **Form fields:** New password minimum 12 characters; confirmation; opaque token supplied by URL and never displayed.
- **Error states:** Expired, invalid, or used token; mismatch; weak password; rate limit. Offer restart recovery.
- **Empty states:** Missing token behaves as invalid.
- **Loading states:** Token validation and submit progress.
- **Success states:** Confirmation and direct route to sign in; token becomes unusable.
- **Mobile behavior:** Single-column, show/hide controls, clear password requirements.

## 5. Admin Operational Pages

### ADM-01 — Role-Adaptive Dashboard

**Route:** `/admin`

- **Page goal:** Prioritize each role’s next operational tasks.
- **User intent:** Understand what needs attention and navigate quickly.
- **Components:** Role-specific summary cards; recent activity; quick actions; new/unassigned/failed-sync leads for relevant roles; incomplete/draft content for editors; assigned follow-ups for consultants.
- **CTA:** Open priority queue; create content; review failed sync; view assigned leads, based on role.
- **Navigation:** Admin sidebar and contextual cards.
- **Form fields:** Optional date/range filter only if supported; otherwise none.
- **Error states:** Individual widget failure is contained with retry; permission mismatch hides/denies safely.
- **Empty states:** Positive zero-state such as “No failed syncs” or task-specific onboarding action.
- **Loading states:** Independent metric/card skeletons.
- **Success states:** Accurate role-scoped data and actionable navigation.
- **Mobile behavior:** Cards stack; high-priority queues appear first; sidebar becomes drawer.

### ADM-02 — All Leads

**Route:** `/admin/leads`

- **Page goal:** Let Support/Super Admin find and manage all consultation leads.
- **User intent:** Triage, filter, assign, follow up, or inspect sync failures.
- **Components:** Page header; result count; search; filters; bounded table; pagination; row actions; selected-filter chips.
- **CTA:** Open lead; clear filters. No manual public-lead creation required unless separately approved.
- **Navigation:** Dashboard; saved URL state; lead detail preserves return state.
- **Form fields:** Search; operational status; consultant; sync status; source type; created range; archived toggle; page/page size up to 100.
- **Error states:** Safe load error with retry; unauthorized roles denied by server.
- **Empty states:** No leads yet; or filtered no-match with clear filters.
- **Loading states:** Table skeleton preserving header/column widths.
- **Success states:** Newest-first role-authorized results and accurate states.
- **Mobile behavior:** Priority columns become labeled cards/row expansion; reference, name, status, assignee, sync, and primary action remain accessible.

### ADM-03 — My Assigned Leads

**Route:** `/admin/leads/assigned-to-me`

- **Page goal:** Give a consultant a focused personal work queue.
- **User intent:** Identify which assigned applicant to contact or follow up next.
- **Components:** Scoped lead list; search; operational status filter; last activity; detail link.
- **CTA:** Open assigned lead.
- **Navigation:** Dashboard and lead detail.
- **Form fields:** Search; allowed status/date filters; pagination.
- **Error states:** Direct access to unassigned data is denied; list failure retries safely.
- **Empty states:** Explain that no leads are currently assigned; no ability to self-assign.
- **Loading states:** Scoped list skeleton.
- **Success states:** Only currently assigned leads appear.
- **Mobile behavior:** Stacked cards ordered by operational priority/recency as configured.

### ADM-04 — Failed Noura Sync Queue

**Route:** `/admin/leads/noura-failed`

- **Page goal:** Help authorized staff diagnose and requeue failed lead delivery.
- **User intent:** Find failures that require manual action.
- **Components:** Failed items table; lead reference; attempt count; last attempt; sanitized error category; external ID if any; detail; retry action.
- **CTA:** Review lead; manual retry.
- **Navigation:** Lead detail; Integrations overview; return to leads.
- **Form fields:** Search/reference; error category; date range; pagination. Retry confirmation requires no editable provider payload.
- **Error states:** Retry request failure gives safe message and keeps existing state; credentials/raw provider errors are never shown.
- **Empty states:** Positive state: no failed synchronizations.
- **Loading states:** Queue/table skeleton; retry action shows per-row progress.
- **Success states:** Retry is audit logged and item moves to Pending/actionable state.
- **Mobile behavior:** Failure cards prioritize reference, last attempt, safe reason, and retry.

### ADM-05 — Archived Leads

**Route:** `/admin/leads/archived`

- **Page goal:** Access retained non-active leads without mixing them into daily work.
- **User intent:** Review history, respond to privacy request, or restore if policy permits.
- **Components:** Archived lead list; search/filters; archive date/reason when available; lead detail.
- **CTA:** View; authorized restore or anonymize where permitted.
- **Navigation:** Leads and dashboard.
- **Form fields:** Search; status; archived date; assignee; pagination.
- **Error states:** Unauthorized restore/anonymize is denied and logged.
- **Empty states:** No archived leads.
- **Loading states:** Table/card skeleton.
- **Success states:** Correct retained records shown separately from active work.
- **Mobile behavior:** Stacked records with archive metadata.

### ADM-06 — Lead Detail

**Route:** `/admin/leads/{id}`

- **Page goal:** Provide a complete role-scoped operational record and actions.
- **User intent:** Understand the applicant, record contact, assign, update status, or manage sync/privacy lifecycle.
- **Components:** Header with public reference, operational status, sync status, assignee, timestamps; Contact; Study Intent; Qualification; Source Context; Message; Notes; Status History; Assignment History; Noura panel; permitted Audit events; action bar.
- **CTA:** Role-dependent: save edit, add note, update status, assign/reassign, retry sync, archive, anonymize.
- **Navigation:** Back to preserved lead-list state; linked source entity opens public preview/new safe tab where appropriate.
- **Form fields:** Editable permitted lead fields; operational status; consultant; note; status reason where configured. Noura IDs/errors are read-only. Consent evidence is read-only.
- **Error states:** Not found, permission denied, edit conflict, validation failure, stale assignment, failed retry, or anonymization constraint; each uses safe actionable feedback.
- **Empty states:** No notes/history/external ID show explicit neutral states; optional qualification values display `Not provided` rather than blank ambiguity.
- **Loading states:** Header and section skeletons; action controls disabled until authorization/data load completes.
- **Success states:** Saved edit/note/status/assignment displays confirmation and new history item; retry becomes Pending; anonymization confirmation removes identifying presentation.
- **Mobile behavior:** Sections become accordions/cards; essential statuses/actions stay near top; destructive actions move to overflow/danger zone.

## 6. Admin Content Pages

### Shared content-list behavior

All content lists provide search, lifecycle filter, translation/SEO completeness indicators, bounded pagination, loading, no-content and filtered-empty states, retry, and role-authorized row actions. Mobile converts lower-priority columns to expandable details.

### ADM-07 — Countries List

**Route:** `/admin/countries`

- **Page goal:** Manage supported destination records.
- **User intent:** Create, find, edit, feature, publish, archive, or safely delete a Draft country.
- **Components:** Shared content list plus ISO code, localized name, university count, featured/order, status.
- **CTA:** Create country; edit; preview; publish/archive.
- **Navigation:** Country editor; related university filter; dashboard.
- **Form fields:** Search; lifecycle; completeness; featured.
- **Error states:** Dependency-aware delete/archive errors; duplicate ISO/slug errors in editor.
- **Empty states:** No countries → create first country; filtered empty → clear filters.
- **Loading states:** Table skeleton.
- **Success states:** Updated list/status and success toast/inline confirmation.
- **Mobile behavior:** Country cards with name, ISO, status, count, primary edit action.

### ADM-08 — Cities / Locations List

**Route:** `/admin/locations`

- **Page goal:** Maintain bilingual location references used by universities.
- **User intent:** Add or correct a city/location without creating inconsistent duplicates.
- **Components:** List with localized label, country, university usage count, active state.
- **CTA:** Create/edit location; deactivate when safe.
- **Navigation:** Country and related university views.
- **Form fields:** Search; country; active state.
- **Error states:** Duplicate location or dependency conflict.
- **Empty states:** Prompt to add a location from or before university creation.
- **Loading states:** Table skeleton.
- **Success states:** Location is available for university forms.
- **Mobile behavior:** Compact cards grouped/filterable by country.

### ADM-09 — Universities List

**Route:** `/admin/universities`

- **Page goal:** Manage institution content and publication readiness.
- **User intent:** Create/edit/publish/archive universities and inspect related Programs.
- **Components:** List with localized name, country/city, type, Program count, translation/SEO completeness, featured state, lifecycle, updated time.
- **CTA:** Create university; edit; preview; view Programs; publish/archive.
- **Navigation:** University editor; related Programs; public preview.
- **Form fields:** Search; country; city; type; status; featured; completeness; pagination.
- **Error states:** Missing country/location, duplicate slug, incomplete bilingual publication, dependency-aware deletion.
- **Empty states:** Prompt to create prerequisite country/location or first university.
- **Loading states:** Table skeleton.
- **Success states:** Saved entity appears with correct readiness/status.
- **Mobile behavior:** Cards prioritize name, country, status, completeness, edit.

### ADM-10 — Programs List

**Route:** `/admin/programs`

- **Page goal:** Manage academic Program inventory and publication.
- **User intent:** Find, create, edit, publish, archive, or inspect a university’s Programs.
- **Components:** List with title, university, level, field, tuition mode, next intake/deadline where available, completeness, status, updated time.
- **CTA:** Create Program; edit; preview; publish/archive.
- **Navigation:** Program editor; university editor/public preview.
- **Form fields:** Search; university; country; level; field; intake; tuition mode; status; completeness; pagination.
- **Error states:** Missing university/taxonomy, invalid tuition range, incomplete translation/SEO, duplicate slug, dependent delete conflict.
- **Empty states:** Prompt to create prerequisite university/taxonomies or first Program.
- **Loading states:** Table skeleton.
- **Success states:** Correct relationship, structured values, and status appear.
- **Mobile behavior:** Cards prioritize title, university, level, status, readiness, edit.

### ADM-11 — News / Articles List

**Route:** `/admin/news`

- **Page goal:** Manage bilingual editorial content.
- **User intent:** Draft, edit, schedule by publication date, publish, or archive an article.
- **Components:** Title, author, publication date, translation/SEO completeness, status, featured image indicator, updated time.
- **CTA:** Create article; edit; preview; publish/archive.
- **Navigation:** Article editor and public preview.
- **Form fields:** Search; author; status; date range; completeness; pagination.
- **Error states:** Missing body/translation/SEO/media requirements; invalid publication date.
- **Empty states:** Create first article or clear filters.
- **Loading states:** Table skeleton.
- **Success states:** Published article appears in public list by publication date.
- **Mobile behavior:** Article cards with title, date, status, readiness.

### ADM-12 — FAQs List

**Route:** `/admin/faqs`

- **Page goal:** Maintain reusable bilingual questions and contextual assignments.
- **User intent:** Create/edit FAQ and assign/order it on supported targets.
- **Components:** Question preview, translation completeness, assignment count/types, status, order controls within assignment context.
- **CTA:** Create FAQ; edit; assign; publish/archive.
- **Navigation:** FAQ editor; assigned target editors/previews.
- **Form fields:** Search; status; target type; completeness.
- **Error states:** Missing translation/answer; invalid or deleted assignment target.
- **Empty states:** No FAQ; no FAQ assigned to selected target.
- **Loading states:** List skeleton.
- **Success states:** FAQ appears in eligible assigned public context and order.
- **Mobile behavior:** Question cards with assignment/status summary.

### ADM-13 — Static Pages List

**Route:** `/admin/pages`

- **Page goal:** Manage Services, About, Contact, Privacy, Terms, homepage-managed copy, and supported singleton content.
- **User intent:** Edit bilingual institutional/legal content and SEO.
- **Components:** Page name/type, translation/SEO completeness, version/effective date for policies, lifecycle, updated time.
- **CTA:** Edit; preview; publish.
- **Navigation:** Static-page editor and public preview.
- **Form fields:** Search; page type; status; completeness.
- **Error states:** Missing required translation/SEO; legal page missing version/effective date.
- **Empty states:** Required singleton is missing → prompt authorized creation/seed recovery.
- **Loading states:** List skeleton.
- **Success states:** Updated localized page and metadata become available.
- **Mobile behavior:** Simple cards by page type.

### ADM-14 — Shared Content Editor

**Route patterns:** `/admin/{content-type}/new`, `/admin/{content-type}/{id}`

- **Page goal:** Create/edit a valid bilingual content entity with clear publication readiness.
- **User intent:** Enter shared data, both translations, relationships, media, and SEO without losing work.
- **Components:** Header/status; tabs or sections: General, Persian, English, Structured Data, Media, Relations, SEO, Publish; completeness checklist; preview; save/publish/archive controls.
- **CTA:** Save Draft; Preview; Publish; Archive; safe Delete only for authorized dependency-free Draft.
- **Navigation:** Back to preserved list; unsaved-change guard; direct links from completeness errors to fields.
- **Form fields:** Entity-specific fields defined in `ADM-15`–`ADM-20`; lifecycle and shared slug; localized content; SEO; media and relationships.
- **Error states:** Field and cross-tab summary; conflict/stale update; upload failure; relationship/dependency failure; publication blocked by incomplete locale/SEO.
- **Empty states:** New Draft begins with clear required-field guidance; optional sections explain when they can be skipped.
- **Loading states:** Existing entity skeleton; save/publish per-action progress; media upload progress.
- **Success states:** Saved timestamp/actor; updated completeness; successful publish with public preview link; archive confirmation.
- **Mobile behavior:** Tabs become horizontal accessible tabs or accordion; sticky save bar may be used; complex structured fields stack.

### ADM-15 — Country Editor Fields

- **Page goal:** Create a valid destination page and relationship root.
- **User intent:** Add or maintain a supported country with complete bilingual presentation.
- **Components:** Shared editor plus country-specific structured section.
- **CTA:** Save Draft, Preview, Publish, Archive, or safe Draft deletion.
- **Navigation:** Follow `ADM-14`; link to related universities and public preview.
- **Form fields:** ISO code; shared slug; Persian/English name; summaries/body where used; hero/card media; localized alt text; featured flag/order; SEO titles/descriptions/social media; lifecycle.
- **Error states:** Duplicate ISO/slug, missing translations/SEO, invalid media, or dependency-protected deletion.
- **Empty states:** New Draft begins with required identity and translation guidance.
- **Loading states:** Follow `ADM-14` with media-upload progress.
- **Success states:** Saved/Published country becomes available to university relations and public discovery.
- **Mobile behavior:** Field groups stack; media/order controls remain touch-accessible.

### ADM-16 — University Editor Fields

- **Page goal:** Create a complete institution profile.
- **User intent:** Add or maintain a verified university and its public presentation.
- **Components:** Shared editor; identity; location; facts; media/gallery; related Programs/FAQs/news; SEO.
- **CTA:** Save Draft, Preview, Publish, Archive, or safe Draft deletion.
- **Navigation:** Follow `ADM-14`; open related Programs, country/location, and public preview.
- **Form fields:** Shared slug; country; city/location; Persian/English name, short description, body; institution type; optional founded year; official URL; optional contact data; logo; hero/gallery; localized alt text; FAQ assignments/order; featured/order; SEO; lifecycle.
- **Error states:** Missing country/location, duplicate slug, invalid URL/media, incomplete bilingual/SEO publication, or dependency-protected deletion.
- **Empty states:** New Draft explains prerequisite country/location; optional facts and relations may be empty.
- **Loading states:** Follow `ADM-14`; gallery uploads expose per-file progress.
- **Success states:** Valid saved/Published university is available to public discovery and Program relationships.
- **Mobile behavior:** Sections stack; gallery becomes a reorderable accessible list rather than a dense grid.

### ADM-17 — Program Editor Fields

- **Page goal:** Create a verifiable academic Program with valid tuition and intake information.
- **User intent:** Add or maintain an academic offering for one university.
- **Components:** Shared editor; university relationship; classification; cost; duration/language; intake/deadline repeater; requirements; official source; FAQs; SEO.
- **CTA:** Save Draft, Preview, Publish, Archive, or safe Draft deletion.
- **Navigation:** Follow `ADM-14`; open university and public preview.
- **Form fields:** Shared slug; university; Persian/English title, summary, description, admission requirements; academic level; field; tuition mode; exact/min/max and currency conditionally; duration value/unit; application fee mode/value/currency; teaching-language labels/codes; one or more intake term/year/optional deadline rows; official URL; FAQ assignments; featured/order; SEO; lifecycle.
- **Error states:** Missing university/taxonomy, duplicate slug, invalid tuition/application fee, invalid intake/deadline, missing official URL, or incomplete publication data.
- **Empty states:** New Draft explains required university and taxonomies; optional FAQ/featured configuration may be empty.
- **Loading states:** Follow `ADM-14`; repeated intake rows keep stable identifiers during saves.
- **Success states:** Valid Program is saved and, when Published, appears under its university and public lists.
- **Mobile behavior:** Tuition and intake repeaters stack as labeled cards with accessible add/remove controls.

### ADM-18 — Article Editor Fields

- **Page goal:** Author and publish trustworthy bilingual editorial content.
- **User intent:** Create or update an article with complete translations and metadata.
- **Components:** Shared editor; author/publication; rich text; featured media; related content; SEO/social preview.
- **CTA:** Save Draft, Preview, Publish, Archive, or safe Draft deletion.
- **Navigation:** Follow `ADM-14`; public preview and related-content links.
- **Form fields:** Shared slug; author; publication date; Persian/English title, summary, body; featured image and localized alt; related/latest configuration where supported; SEO/social metadata; lifecycle.
- **Error states:** Missing bilingual body/SEO, invalid date, unsafe rich text, failed image upload, or duplicate slug.
- **Empty states:** New Draft starts with title/body guidance; optional relations may remain empty.
- **Loading states:** Follow `ADM-14`; rich-text and media state restore without content loss.
- **Success states:** Saved/Published article appears in the correct date order with valid metadata.
- **Mobile behavior:** Toolbar and preview remain usable; desktop is preferred for long-form authoring.

### ADM-19 — FAQ Editor Fields

- **Page goal:** Create a reusable answer and assign it to relevant contexts.
- **User intent:** Maintain a bilingual FAQ and its display order on supported targets.
- **Components:** Shared editor; bilingual question/answer; assignments/order.
- **CTA:** Save Draft, Publish/Archive, assign target, preview target.
- **Navigation:** FAQ list, assigned entity editors, and public target preview.
- **Form fields:** Persian/English question and answer; status; target type/id; display order per assignment.
- **Error states:** Missing locale/answer blocks publish; invalid/archived target and duplicate assignment are rejected.
- **Empty states:** New FAQ has no assignments until explicitly added; explain that unassigned FAQ is not shown publicly.
- **Loading states:** Editor and assignment-row skeletons; per-assignment save progress.
- **Success states:** Published FAQ appears on eligible targets in configured order.
- **Mobile behavior:** Assignment rows stack with accessible order controls.

### ADM-20 — Static Page Editor Fields

- **Page goal:** Maintain approved institutional and legal page content.
- **User intent:** Update a singleton public page without changing its canonical identity.
- **Components:** Shared editor; page-type-specific body modules; legal metadata; SEO.
- **CTA:** Save Draft, Preview, Publish, or Archive where policy permits.
- **Navigation:** Static page list and canonical public preview.
- **Form fields:** Page type/system key; Persian/English title, summary/body/modules; effective date and policy version for Privacy/Terms; contact data where relevant; SEO/social fields; lifecycle.
- **Error states:** Immutable system-key change, missing bilingual/SEO fields, invalid contact data, or missing legal policy version/effective date.
- **Empty states:** New/seeded page explains required modules; optional content modules may be absent.
- **Loading states:** Follow `ADM-14`; structured modules preserve order and content during save.
- **Success states:** Published singleton updates its canonical public route and metadata.
- **Mobile behavior:** Modules stack with accessible reorder controls; desktop preferred for complex layout preview.

## 7. Admin Media, Taxonomy, SEO, and Governance Pages

### ADM-21 — Media Library

**Route:** `/admin/media`

- **Page goal:** Store and reuse safe, optimized, attributable media.
- **User intent:** Upload, find, inspect, select, or archive an asset.
- **Components:** Upload action; grid/list; search/filter; preview drawer/detail; metadata; usage references; pagination.
- **CTA:** Upload media; select/insert when opened as picker; edit metadata; archive unused asset.
- **Navigation:** Back to invoking editor when used as picker.
- **Form fields:** Files; localized alt text; caption; attribution/source; optional tags; focal point if implemented.
- **Error states:** Unsupported type, size limit, content mismatch, processing failure, duplicate warning, asset-in-use archive/delete restriction.
- **Empty states:** Upload first approved asset.
- **Loading states:** Upload/processing progress; thumbnail skeletons.
- **Success states:** Optimized asset with dimensions/type/size and non-guessable key is available.
- **Mobile behavior:** Grid reduces columns; uploader supports device picker; detail becomes full-screen sheet.

### ADM-22 — Taxonomy Lists and Editors

**Routes:** `/admin/taxonomies/{type}`

- **Page goal:** Maintain stable option sets for levels, fields, intakes, currencies, gender, marital status, and budget ranges.
- **User intent:** Add/edit/reorder/deactivate a localized option without breaking existing data.
- **Components:** Type switcher; table; code; bilingual labels; order; active state; usage count; inline or drawer editor.
- **CTA:** Add option; save; reorder; deactivate.
- **Navigation:** Taxonomy index and related content filter where useful.
- **Form fields:** Stable English code; Persian label; English label; display order; active state; type-specific fields such as ISO currency/symbol or budget range boundaries/currency applicability.
- **Error states:** Duplicate/changed referenced code, invalid range/order, dependency-protected delete.
- **Empty states:** Explain prerequisites and add first option.
- **Loading states:** Table skeleton and per-row save state.
- **Success states:** Updated options become available in relevant forms without changing stored codes.
- **Mobile behavior:** Editable cards/drawer; reordering uses accessible buttons rather than drag only.

### ADM-23 — SEO and Navigation Settings

**Route:** `/admin/seo-navigation`

- **Page goal:** Manage global metadata defaults and public navigation/footer content safely.
- **User intent:** Update organization SEO, menus, footer, and inspect sitemap status.
- **Components:** Global SEO; Organization schema fields; navigation builder; footer groups; sitemap summary; preview.
- **CTA:** Save Draft/configuration; preview; publish configuration.
- **Navigation:** Settings, content previews.
- **Form fields:** Bilingual default title/description; social image; organization name/logo/contact/social URLs; navigation label/target/order; footer label/target/order; x-default/home configuration where needed.
- **Error states:** Invalid/internal route, duplicate item, inaccessible label, missing translation, malformed URL, sitemap generation failure.
- **Empty states:** Seed required navigation defaults; optional social links may be absent.
- **Loading states:** Form skeleton and preview generation state.
- **Success states:** Valid bilingual navigation/footer and metadata are published; sitemap status updates.
- **Mobile behavior:** Configuration cards stack; reordering has accessible up/down controls; desktop preferred for full preview.

### ADM-24 — Noura Integrations Overview

**Route:** `/admin/integrations/noura`

- **Page goal:** Monitor delivery health without exposing secrets.
- **User intent:** Determine whether queue/sync needs attention and reach failed items.
- **Components:** Adapter mode (Mock/Real); safe connection status; Pending/Synced/Failed counts; oldest queue age; recent sanitized failures; link to failed queue; retry controls where authorized.
- **CTA:** Review failures; retry eligible item; run safe connectivity check only if supported.
- **Navigation:** Failed queue and lead detail.
- **Form fields:** Safe filters only. Credentials are not editable/displayed here unless a separately approved secret-management workflow exists.
- **Error states:** Provider unavailable, worker stale, configuration missing, or metrics failure with safe operator guidance.
- **Empty states:** No queued/failed items is a positive state.
- **Loading states:** Metric and recent-event skeletons.
- **Success states:** Current health and queue state are visible; actions audit logged.
- **Mobile behavior:** Metrics stack; failure list becomes cards; no dense raw payload view.

### ADM-25 — Admin Users

**Route:** `/admin/team`

- **Page goal:** Let Super Admin govern administrative identities and roles.
- **User intent:** Create, activate/deactivate, inspect, or change an admin user’s role.
- **Components:** User table; search; role/state filters; create/edit drawer/page; last login/security state where safely available.
- **CTA:** Add admin user; edit role; activate/deactivate; initiate safe reset where approved.
- **Navigation:** User detail/editor; Audit Logs.
- **Form fields:** Name; unique lowercase email; role; active state. Password setup uses secure invitation/reset or controlled initial flow—never displayed after creation.
- **Error states:** Duplicate email, invalid role, attempt to remove required last Super Admin, unauthorized access, delivery failure for setup email.
- **Empty states:** System must retain at least one Super Admin; filtered no-match permits reset.
- **Loading states:** Table/editor skeleton.
- **Success states:** User/role/state update confirmed and audit logged.
- **Mobile behavior:** User cards; role/state editor in full-screen sheet; dangerous actions separated.

### ADM-26 — Audit Logs

**Route:** `/admin/audit-logs`

- **Page goal:** Provide immutable, redacted evidence of material system actions.
- **User intent:** Investigate who changed what and when.
- **Components:** Search/filter; event table; actor; action; entity; time; request ID; redacted detail drawer; pagination.
- **CTA:** View event detail; clear filters. No edit/delete CTA.
- **Navigation:** Link to still-authorized entity detail.
- **Form fields:** Actor; action category; entity type/ID; date range; request/correlation ID.
- **Error states:** Unauthorized access denied; log retrieval failure; missing referenced entity shown without breaking event.
- **Empty states:** No events in selected range; clear filters.
- **Loading states:** Immutable table skeleton.
- **Success states:** Redacted event details render read-only.
- **Mobile behavior:** Event cards with expandable safe diff; filters in sheet.

### ADM-27 — Organization and Site Settings

**Route:** `/admin/settings/site`

- **Page goal:** Manage global organization, contact, locale, and safe site configuration.
- **User intent:** Update shared details without code changes.
- **Components:** Organization; contact; locale/site; default behavior; environment/read-only deployment info where useful.
- **CTA:** Save settings.
- **Navigation:** SEO/Navigation, consultation settings.
- **Form fields:** Approved organization name; contact channels; address/hours; default locale behavior; supported locales fixed to fa/en; approved social URLs; safe feature flags where implemented.
- **Error states:** Invalid URL/contact value, missing required bilingual label, configuration conflict.
- **Empty states:** Optional channels may remain absent; required defaults are seeded.
- **Loading states:** Form skeleton and save state.
- **Success states:** Saved settings propagate to public shell where applicable and are audit logged.
- **Mobile behavior:** Section cards stack; sticky save action may be used.

### ADM-28 — Consultation Configuration

**Route:** `/admin/settings/consultation`

- **Page goal:** Maintain localized consultation option sets and policy-linked presentation without changing code.
- **User intent:** Update available countries/options, budget ranges, gender/marital labels, CTA copy, or consent policy reference within approved scope.
- **Components:** Form-copy section; option-set links/editors; consent version/current links; preview; deduplication/retry rules shown read-only unless explicitly configurable.
- **CTA:** Save configuration; preview form.
- **Navigation:** Public consultation preview, taxonomies, Privacy/Terms editors.
- **Form fields:** Bilingual heading/help/CTA text; option availability/order; default currency options; active Privacy/Terms policy versions. Core required-field and deduplication behavior remains governed by requirements.
- **Error states:** Missing translation, invalid option set, inactive policy version, configuration that would remove required choices.
- **Empty states:** Seeded defaults required before form publication.
- **Loading states:** Form/preview skeleton.
- **Success states:** Public form preview reflects valid localized configuration; change is audited.
- **Mobile behavior:** Configuration sections stack; desktop recommended for side-by-side preview.

## 8. Cross-Page State and Transition Rules

### 8.1 Public transitions

- List → detail retains the list URL so Back restores query/filter/page.
- Detail → consultation passes trusted source IDs and a user-readable context label.
- Consultation → Privacy/Terms should preserve safe form state when the user returns.
- Successful consultation must not navigate to a nonexistent public tracking page.
- Locale switch attempts the equivalent route/slug; if unavailable due to invalid state, it falls back to the appropriate locale root with explanation only when necessary.

### 8.2 Admin transitions

- List → editor/detail → Back returns to prior filters/page when safe.
- Save Draft keeps the user on the editor and updates dirty/completeness state.
- Publish requires a complete cross-section validation pass.
- Archive removes content from public discovery/sitemap according to policy.
- Lead assignment/status/note actions update history immediately after confirmed save.
- Noura retry changes only sync workflow; it does not change operational lead status.

## 9. Responsive Breakpoint Intent

Exact breakpoints belong to the design system; behavior is defined semantically:

| Mode | UX behavior |
|---|---|
| Narrow mobile | One-column forms/content; menu/filter drawer; cards instead of dense tables; full-width primary actions |
| Wide mobile / tablet | One or two card columns; form grouping only when labels/inputs retain comfortable width |
| Laptop | Full public navigation; two-column consultation form; Admin sidebar and bounded tables |
| Wide desktop | Centered maximum content width; additional whitespace, not unbounded text/table stretching |

## 10. Page-Level Acceptance Checklist

For every implemented page:

- [ ] Goal and primary user intent are reflected above the fold or in the first meaningful Admin viewport.
- [ ] One clear primary CTA exists where the page has an action goal.
- [ ] Navigation and Back behavior are predictable.
- [ ] All required fields and conditional rules match the SRS.
- [ ] Error messages are safe, localized, and actionable.
- [ ] Empty states explain the condition and offer a valid next action.
- [ ] Loading states preserve layout and do not block unrelated usable controls.
- [ ] Success states confirm the outcome and next step.
- [ ] Mobile behavior avoids horizontal overflow and inaccessible hidden actions.
- [ ] Keyboard focus order, labels, contrast, status semantics, and reduced motion target WCAG 2.2 AA.
- [ ] Persian RTL and English LTR behave equivalently.
- [ ] No Post-MVP action is shown as working functionality.

## 11. Change Control

Any page addition, removed state, new form field, changed CTA, role permission, or navigation change that affects scope must first be approved in `PROJECT_CONTEXT.md`. The change must then be synchronized across this document, `INFORMATION_ARCHITECTURE.md`, `USER_JOURNEYS.md`, `SRS.md`, API/schema documentation, and relevant tests.
