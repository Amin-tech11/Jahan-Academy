# Jahan Academy — Software Requirements Specification

> **Document type:** Software Requirements Specification (SRS)
> **Version:** 1.0
> **Baseline:** MVP v1
> **Date:** September 22, 2026
> **Target delivery window:** 21–28 Mehr 1405
> **Normative source:** [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)

## Document Control

This SRS converts the approved Product Requirements into testable software requirements. `PROJECT_CONTEXT.md` remains the product source of truth. If the two documents conflict, implementation shall stop at the conflicting requirement until `PROJECT_CONTEXT.md` is updated and this SRS is synchronized.

The words **shall**, **should**, and **may** mean mandatory, recommended, and optional respectively. `P0` is required for MVP acceptance, `P1` is desirable only when it does not threaten P0 delivery, and `Post-MVP` is excluded from this release.

## 1. Project Overview

Jahan Academy is a bilingual educational-migration platform for people aged primarily 18–40 who want to study abroad, apply to a university, immigrate through education, or develop their educational and career path.

The MVP is a public discovery, content, and lead-generation system. Visitors can explore countries, universities, and academic programs; search and filter programs; read bilingual news and guidance; and submit a free-consultation request without creating an account. Internal staff manage content and consultation leads through a role-controlled administration panel. Accepted consultation requests are stored locally and synchronized asynchronously with the Noura CRM/ERP.

### 1.1 Product objective

The primary MVP conversion is a successfully persisted free-consultation request. The main site-wide CTA is `درخواست مشاوره رایگان` / `Request Free Consultation`.

### 1.2 Business objectives

1. Generate qualified consultation leads.
2. Convert relevant visitors into consultation requests.
3. Support future university-application demand without implementing the full application workflow in MVP.
4. Publish trustworthy bilingual educational-migration content.
5. Build organic acquisition through indexable university, program, country, and editorial pages.
6. Prepare a maintainable foundation for future courses, user accounts, applications, booking, and payments.

### 1.3 System context

- Public visitors use the bilingual website without authentication.
- Administrative users authenticate to a private panel.
- PostgreSQL is the system of record for content, identities, applicants, leads, applications, learning, commerce, assignments, audit, and synchronization state as those modules are delivered.
- FastAPI is the authoritative backend and exposes a versioned API to Next.js, future mobile clients, and integrations.
- Celery workers deliver accepted leads to Noura and execute notification, document, media, import/export, and scheduled workflows through provider-neutral adapters.
- Media, payments, email, SMS/OTP, and meeting services are accessed through replaceable provider interfaces.

## 2. Scope

### 2.1 In scope — P0 MVP

- Responsive Persian RTL and English LTR public website under `/fa/...` and `/en/...`.
- Homepage, country/destination pages, university list/detail, academic program list/detail, news list/detail, Services, About, Contact, Privacy, Terms, and localized error pages.
- Search, filter, sort, URL state, and server-driven pagination.
- Free-consultation form available globally and contextually from universities/programs.
- Lead persistence, deduplication, public reference code, assignment, status history, notes, archive/anonymization, and audit events.
- Noura adapter, mock connector, transactional outbox, automatic retries, manual retries, and independent sync state.
- Custom administration panel for content, taxonomies, media, leads, administrative users, roles, SEO, sync state, and audit logs.
- Technical SEO, structured data, canonical URLs, hreflang, sitemaps, robots rules, social metadata, and image alt text.
- Local and staging environments, automated quality gates, backup/restore documentation, observability, and production readiness.

### 2.2 Conditional P1 scope

- Configurable featured universities/programs.
- Reusable FAQs assigned to homepage, universities, and programs.
- Contact form only if it reuses the consultation-lead workflow.
- Basic consultation-lead CSV export.

### 2.3 Out of scope for MVP

- Public user registration/login, OTP, Google login, applicant profiles, identity verification, and applicant document storage.
- Favorites, saved comparisons, personalized recommendations, admission-chance calculation, notifications, and public request history.
- Full university Application workflow and institutional submission.
- Language courses as a product entity.
- Paid consultation booking, calendar scheduling, payments, invoices, coupons, refunds, and financial reporting.
- LMS, instructors, lessons, classes, examinations, certificates, and learning progress.
- Newsletter, webinars, campaign automation, advanced CRM reporting, A/B testing, and heatmaps.
- Advanced discovery filters not expressly listed in this SRS.

## 3. Actors

| Actor | Authentication | Responsibilities and access |
|---|---|---|
| Visitor | None | Browse public bilingual content, search/filter/sort, and submit a consultation request |
| Prospective Applicant | None in MVP | Use university/program context to request guidance; functionally a Visitor in MVP |
| Super Admin | Email/password | Full content, lead, assignment, user/role, SEO, Noura retry, audit, configuration, archive, and allowed deletion controls |
| Content Editor | Email/password | Create, edit, publish, archive, and manage bilingual countries, universities, programs, news, FAQs, media, and SEO metadata |
| Support | Email/password | View/edit all leads, make initial contact, assign/reassign consultants, update statuses, add notes, and retry failed Noura synchronization |
| Consultant | Email/password | View only currently assigned leads, add notes/contact outcomes, and perform allowed status changes |
| Noura CRM/ERP | Service authentication | Receive lead data through the adapter and return an external identifier or classified error |
| Background Worker | Internal process | Claim outbox jobs, call the Noura adapter, schedule retries, and persist sanitized results |
| System Operator | Infrastructure access | Deploy, monitor, back up, restore, rotate secrets, and respond to incidents |

### 3.1 Authorization principles

The listed MVP behaviors are minimum product requirements. Their concrete permission-code and scope
mapping, plus final-product roles such as Instructor, Sales, and Admin, will be finalized in
`AUTHORIZATION_DESIGN.md` before protected endpoints are released.

- Every administrative route and query shall be authorized on the server.
- A hidden or disabled UI control shall never be treated as authorization.
- Consultants shall never access unassigned leads.
- Only Super Admin shall manage administrative identities/roles or access complete audit logs.
- Content Editors may publish without a second approval step.

## 4. Functional Requirements

### 4.1 Localization and public shell

| ID | Priority | Requirement |
|---|---|---|
| FR-LOC-001 | P0 | Every public page shall use an explicit `/fa` or `/en` locale prefix. |
| FR-LOC-002 | P0 | Persian pages shall be fully RTL and English pages fully LTR, including navigation, icons, breadcrumbs, carousels, forms, and validation. |
| FR-LOC-003 | P0 | The language switcher shall navigate to the equivalent entity/page in the alternate locale when available. |
| FR-LOC-004 | P0 | Publishing shall be blocked until all required Persian and English content is complete; no cross-language fallback is allowed. |
| FR-LOC-005 | P0 | Localized versions of an entity shall share one lowercase English-readable slug. |
| FR-LOC-006 | P0 | Header, footer, navigation, search access, locale switcher, and primary CTA shall work on mobile, tablet, laptop, and wide desktop. |

### 4.2 Homepage and static pages

| ID | Priority | Requirement |
|---|---|---|
| FR-HOME-001 | P0 | The homepage shall explain the product purpose and display the consultation CTA above the fold. |
| FR-HOME-002 | P0 | The homepage shall provide direct entry to university and program discovery. |
| FR-HOME-003 | P0 | Authorized users shall manage featured destinations, institutions/programs, benefits, latest news, FAQs, and CTA copy. |
| FR-HOME-004 | P0 | Services, About, Contact, Privacy, and Terms shall have editable bilingual content and SEO metadata. |
| FR-HOME-005 | P0 | Localized 404 and general-error pages shall provide recovery navigation. |

### 4.3 Countries and universities

| ID | Priority | Requirement |
|---|---|---|
| FR-UNI-001 | P0 | Authorized content users shall manually create and manage countries, cities as needed, and universities. |
| FR-UNI-002 | P0 | Each university shall belong to one country and one city/location representation. |
| FR-UNI-003 | P0 | University data shall include shared slug, bilingual name/descriptions, logo, hero/gallery media, location, institution type, optional founding year, official website, optional contact data, and SEO fields. |
| FR-UNI-004 | P0 | Universities shall support `Draft`, `Published`, and `Archived`. |
| FR-UNI-005 | P0 | The public university list shall support name search, pagination, loading, empty, and recoverable error states. |
| FR-UNI-006 | P0 | University details shall show verified institution information, published programs, assigned FAQs, related news when available, and a contextual consultation CTA. |
| FR-UNI-007 | P0 | Consultation initiated from a university shall retain its trusted ID/name as lead source context. |
| FR-UNI-008 | P1 | Editors may mark universities as featured and set homepage display order. |

### 4.4 Academic programs

| ID | Priority | Requirement |
|---|---|---|
| FR-PRG-001 | P0 | An MVP Program shall be a university academic program such as Bachelor, Master, or PhD; language courses are excluded. |
| FR-PRG-002 | P0 | Each Program shall belong to exactly one university. |
| FR-PRG-003 | P0 | Program data shall include shared slug, bilingual title/descriptions, university, level, field, intakes, tuition, duration, deadlines, application fee, teaching language, admission requirements, official source URL, and SEO fields. |
| FR-PRG-004 | P0 | Tuition shall support exact, range, and `Contact us` modes; exact/range modes require an ISO currency. |
| FR-PRG-005 | P0 | Program intakes shall support term, year, and optional deadline. |
| FR-PRG-006 | P0 | Programs shall support `Draft`, `Published`, and `Archived`. |
| FR-PRG-007 | P0 | The list shall support title search and filters for academic level, field of study, and intake. |
| FR-PRG-008 | P0 | Combined filters, removable active-filter indicators, reset, and shareable/bookmarkable URL state shall be supported. |
| FR-PRG-009 | P0 | Sort shall support title A–Z and tuition ascending/descending; non-numeric tuition shall follow priced programs. |
| FR-PRG-010 | P0 | Public lists shall return no more than 20 records per page; panel APIs shall return no more than 100. |
| FR-PRG-011 | P0 | Program details shall show available structured data, university relationship, contextual FAQs, and consultation CTA. |
| FR-PRG-012 | P0 | Consultation initiated from a Program shall retain trusted Program and university context. |

### 4.5 Search, filters, and URL state

| ID | Priority | Requirement |
|---|---|---|
| FR-SRCH-001 | P0 | Search shall be case-insensitive and locale-aware for the active locale. |
| FR-SRCH-002 | P0 | Query, filters, sorting, and page shall be represented by stable URL query parameters. |
| FR-SRCH-003 | P0 | Unknown/invalid filter values shall be ignored safely and shall not generate a server error. |
| FR-SRCH-004 | P0 | Changing query, filter, or sort shall reset the result page to 1. |
| FR-SRCH-005 | P0 | Empty results shall explain the state and offer reset and consultation actions. |
| FR-SRCH-006 | P0 | Loading shall use non-jarring skeletons; recoverable errors shall expose retry. |

### 4.6 News, FAQs, and media

| ID | Priority | Requirement |
|---|---|---|
| FR-CNT-001 | P0 | News shall contain a shared slug, bilingual title/summary/body, featured image, author, publication date, and SEO metadata. |
| FR-CNT-002 | P0 | News shall support `Draft`, `Published`, and `Archived`; Content Editors may publish directly. |
| FR-CNT-003 | P0 | News details shall show author/date, semantic heading structure, social metadata, and related/latest content when available. |
| FR-CNT-004 | P1 | Reusable bilingual FAQs may be assigned and ordered on the homepage, university, or Program. |
| FR-CNT-005 | P0 | Published news and FAQs shall have complete Persian and English content. |
| FR-MED-001 | P0 | Media uploads shall retain type, dimensions, size, alt text, attribution/source where required, and a non-guessable storage key. |
| FR-MED-002 | P0 | Public images shall be delivered responsively in optimized formats/sizes. |

### 4.7 Consultation request

| ID | Priority | Requirement |
|---|---|---|
| FR-LEAD-001 | P0 | The form shall collect first name, last name, required mobile, optional email, desired country, intake term, start year, optional age, gender, occupation, marital status, investment/budget range and currency, optional message, and required privacy/contact consent. |
| FR-LEAD-002 | P0 | Intake values shall be `Spring`, `Summer`, `Fall`, `Winter`, or `Unknown`, localized at display boundaries. |
| FR-LEAD-003 | P0 | Iranian and international mobile formats shall be accepted and normalized to E.164 where possible. |
| FR-LEAD-004 | P0 | Client and server validation shall use equivalent schemas; server validation is authoritative. |
| FR-LEAD-005 | P0 | A valid lead shall be persisted locally before any Noura delivery attempt. |
| FR-LEAD-006 | P0 | Every accepted lead shall receive a random non-sequential public reference shown in the success state. |
| FR-LEAD-007 | P0 | Locale, source URL, and optional trusted university/Program context shall be stored. |
| FR-LEAD-008 | P0 | No confirmation SMS or email shall be sent in MVP. |
| FR-LEAD-009 | P0 | A detected duplicate shall return the existing reference without creating a second lead or Noura create event. |
| FR-LEAD-010 | P0 | Success shall explain the next step; recoverable failure shall preserve non-sensitive input and permit retry. |
| FR-LEAD-011 | P0 | The form shall follow the approved responsive two-column desktop/single-column mobile presentation with persistent labels and full-width primary action. |
| FR-LEAD-012 | P0 | Age, gender, occupation, marital status, and budget fields shall be optional and offer `Prefer not to say` where applicable. |
| FR-LEAD-013 | P0 | Supplied age shall be an integer from 18–100 without acting as an automatic rejection gate; budget shall use configurable ranges and an ISO currency. |

### 4.8 Lead operations

| ID | Priority | Requirement |
|---|---|---|
| FR-OPS-001 | P0 | Operational statuses shall be `New`, `Assigned`, `Contacted`, `Qualified`, `Not Qualified`, `Converted`, and `Closed`. |
| FR-OPS-002 | P0 | Noura sync status shall be independently tracked as `Pending`, `Synced`, or `Failed`. |
| FR-OPS-003 | P0 | Super Admin and Support shall search, filter, view, edit, assign/reassign, annotate, and update any lead. |
| FR-OPS-004 | P0 | A lead shall have at most one current consultant and shall retain complete assignment history. |
| FR-OPS-005 | P0 | Consultants shall access only their assigned leads and only permitted notes/status operations. |
| FR-OPS-006 | P0 | Status, assignment, material edits, anonymization, and manual sync attempts shall create audit events. |
| FR-OPS-007 | P0 | The panel shall not permanently delete leads; authorized users may archive or anonymize them. |

### 4.9 Noura CRM/ERP integration

| ID | Priority | Requirement |
|---|---|---|
| FR-NOURA-001 | P0 | Integration shall use a provider-neutral interface with a mock implementation until the real API is available. |
| FR-NOURA-002 | P0 | Lead and outbox record shall be created atomically in one database transaction. |
| FR-NOURA-003 | P0 | Delivery shall attempt immediately and retry at approximately 5 minutes, 30 minutes, 2 hours, 12 hours, and 24 hours. |
| FR-NOURA-004 | P0 | Exhausted retries shall mark synchronization `Failed`; Super Admin and Support may request manual retry. |
| FR-NOURA-005 | P0 | The system shall persist external ID, attempts, last-attempt time, success time, and sanitized last error. |
| FR-NOURA-006 | P0 | Every call shall include a stable idempotency key derived from the local lead identity. |
| FR-NOURA-007 | P0 | Public clients shall never receive provider credentials or detailed provider errors. |
| FR-NOURA-008 | P0 | Production connector acceptance depends on Noura documentation, sandbox access, and agreed mapping. |

### 4.10 Administration and authentication

| ID | Priority | Requirement |
|---|---|---|
| FR-ADM-001 | P0 | Administrators shall authenticate using email and password; no public authentication exists in MVP. |
| FR-ADM-002 | P0 | Password recovery shall use a single-use expiring email link; development shall use local mail capture. |
| FR-ADM-003 | P0 | Repeated failed authentication shall cause temporary account lockout. |
| FR-ADM-004 | P0 | Only Super Admin shall manage administrative users, activation, and roles. |
| FR-ADM-005 | P0 | The panel shall manage countries, locations, universities, programs, taxonomies, currencies, news, FAQs, media, and SEO. |
| FR-ADM-006 | P0 | Forms shall prevent accidental data loss and show validation/save outcomes. |
| FR-ADM-007 | P0 | Admin lists shall provide search, status filters, pagination, empty, and recoverable error states. |
| FR-ADM-008 | P0 | Audit logs shall be immutable through the application UI. |

### 4.11 SEO

| ID | Priority | Requirement |
|---|---|---|
| FR-SEO-001 | P0 | Indexable pages shall provide localized title, description, canonical URL, Open Graph metadata, and meaningful image alt text. |
| FR-SEO-002 | P0 | Persian and English equivalents shall emit reciprocal hreflang plus an appropriate `x-default`. |
| FR-SEO-003 | P0 | XML sitemaps shall contain only canonical, published, indexable URLs. |
| FR-SEO-004 | P0 | `robots.txt` shall exclude administrative/non-public routes but shall not serve as access control. |
| FR-SEO-005 | P0 | Visible breadcrumbs shall be represented using valid `BreadcrumbList` structured data. |
| FR-SEO-006 | P0 | Structured data shall use only valid types supported by visible content. |
| FR-SEO-007 | P0 | Search/arbitrary filter combinations shall be `noindex,follow` and canonicalize to the unfiltered list. |
| FR-SEO-008 | P0 | Archived URLs shall leave sitemaps and produce an intentional redirect, `404`, or `410`. |

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-PERF-001 | Performance | Representative public pages shall achieve Lighthouse Performance ≥ 90 in agreed mobile production-like tests. |
| NFR-PERF-002 | Web Vitals | At the 75th percentile, target LCP < 2.5 s, INP < 200 ms, and CLS < 0.1. |
| NFR-PERF-003 | Media | Images shall be compressed, responsive, dimensioned, and lazy-loaded below the fold; critical hero media shall load eagerly. |
| NFR-SCALE-001 | Scalability | Baseline load tests shall support at least 100 concurrent public and 20 concurrent panel users without data loss or material error-rate degradation. |
| NFR-SCALE-002 | Capacity | University and Program counts shall have no commercial hard cap; list APIs shall remain indexed and paginated. |
| NFR-AVL-001 | Availability | Production shall target 99.5% monthly availability excluding announced maintenance and upstream outages. |
| NFR-REL-001 | Reliability | Noura downtime shall not block lead acceptance, and durable retry shall survive process/application restarts. |
| NFR-BCK-001 | Backup | Database and uploaded-file backups shall run daily and be retained for 30 days. |
| NFR-BCK-002 | Recovery | Initial recovery objectives are RPO ≤ 24 hours and RTO ≤ 4 hours, demonstrated by a documented restore test. |
| NFR-A11Y-001 | Accessibility | Key public/admin flows shall target WCAG 2.2 AA, including keyboard, focus, contrast, labels, validation, and reduced motion. |
| NFR-COMP-001 | Compatibility | The latest two stable versions of Chrome, Firefox, Edge, and Safari shall be supported, including iOS Safari and Android Chrome. |
| NFR-RESP-001 | Responsive | Mobile, tablet, laptop, and wide desktop shall render without unintended horizontal overflow. |
| NFR-OBS-001 | Observability | Errors, worker failures, security events, and correlation IDs shall be logged without secrets or unnecessary personal data. |
| NFR-MNT-001 | Maintainability | Strict TypeScript, modular domains, migrations, automated tests, adapter boundaries, and documented configuration are mandatory. |
| NFR-PRV-001 | Privacy | Lead personal data shall be retained for three years after the last meaningful interaction unless a legal/contractual rule requires otherwise. |
| NFR-PRV-002 | Data rights | Verified eligible deletion requests shall be fulfilled by anonymization within 30 days. |
| NFR-I18N-001 | Localization | Dates, numbers, currencies, labels, errors, and direction shall be locale-aware; persisted machine values shall remain locale-neutral. |

## 6. Business Rules

### 6.1 Content and publication

- `BR-CNT-001`: Required Persian, English, and SEO fields must be complete before publication.
- `BR-CNT-002`: `Draft`, `Published`, and `Archived` are the only MVP content lifecycle states.
- `BR-CNT-003`: Authorized permanent deletion is limited to Draft content without dependencies.
- `BR-CNT-004`: Published or referenced content must be archived/soft-deleted; destructive cleanup requires Super Admin and dependency checks.
- `BR-CNT-005`: A Program belongs to exactly one university, and a university belongs to one country.
- `BR-CNT-006`: Language courses shall not be modeled as academic Programs in MVP.

### 6.2 Tuition and Program data

- `BR-PRG-001`: Exact tuition requires amount and ISO currency.
- `BR-PRG-002`: Tuition range requires minimum, maximum, and currency, with minimum ≤ maximum.
- `BR-PRG-003`: `Contact us` tuition stores no public numeric tuition.
- `BR-PRG-004`: Numeric tuition sorts place unknown/contact-priced Programs last.
- `BR-PRG-005`: A deadline belongs to a specific Program intake whenever possible.

### 6.3 Consultation leads

- `BR-LEAD-001`: Mobile and explicit privacy/contact consent are required; email and qualification fields are optional.
- `BR-LEAD-002`: A duplicate has the same normalized mobile, desired country, intake, and start year within 24 hours.
- `BR-LEAD-003`: A duplicate returns the existing reference, records a duplicate event, and creates neither a second lead nor a second Noura create request.
- `BR-LEAD-004`: Each lead has exactly one operational status and one independent Noura sync status.
- `BR-LEAD-005`: A lead has zero or one current consultant; previous assignments are retained.
- `BR-LEAD-006`: `Converted` means an agreed operational/commercial outcome; final CRM semantics must align with Noura before launch.
- `BR-LEAD-007`: Ordinary panel actions cannot permanently delete a lead.
- `BR-LEAD-008`: Age, gender, occupation, marital status, or budget alone cannot automatically reject/suppress an accepted request.
- `BR-LEAD-009`: Gender, marital-status, and budget-range values use stable language-neutral codes with localized labels.

### 6.4 Noura delivery

- `BR-NOURA-001`: Local database persistence is the acceptance point for the public request.
- `BR-NOURA-002`: `Synced` requires confirmed provider success and a stored Noura external ID.
- `BR-NOURA-003`: Timeouts/5xx are retryable; validation/auth failures require operator attention and shall not retry forever.
- `BR-NOURA-004`: Manual retry is idempotent and audit logged.
- `BR-NOURA-005`: The mock adapter is the integration acceptance target until Noura documentation and access exist.

### 6.5 URL and SEO

- `BR-SEO-001`: Both locales always use explicit prefixes.
- `BR-SEO-002`: Slugs are lowercase English, hyphen-separated, shared across locales, and unique within entity type.
- `BR-SEO-003`: Arbitrary search/filter result pages are not indexable.
- `BR-SEO-004`: Structured data must match visible content; invented/unsupported properties are forbidden.

## 7. Use Cases

### UC-01 — Browse localized public website

- **Primary actor:** Visitor
- **Preconditions:** A supported public route exists.
- **Main flow:** The visitor opens `/fa` or `/en`; the system renders the correct direction, navigation, localized content, SEO metadata, and primary CTA; the visitor may switch to the equivalent locale.
- **Alternative:** Missing or archived content returns an intentional localized 404/410/redirect with recovery actions.
- **Postcondition:** No authentication or personal data is required.
- **Traceability:** FR-LOC-001–006, FR-HOME-001–005, FR-SEO-001–008.

### UC-02 — Discover universities

- **Primary actor:** Visitor
- **Preconditions:** At least one Published university exists.
- **Main flow:** Visitor opens university list, searches by name, navigates pagination, opens a result, views verified details and published related Programs, then may open the contextual consultation form.
- **Alternatives:** Empty search offers reset/consultation; transient failure offers retry.
- **Postcondition:** If consultation starts, the university context is retained.
- **Traceability:** FR-UNI-001–008, FR-SRCH-001–006.

### UC-03 — Discover academic Programs

- **Primary actor:** Visitor
- **Preconditions:** Published Programs and their universities exist.
- **Main flow:** Visitor searches, applies level/field/intake filters, sorts, changes page, shares the URL, opens a Program, and views structured facts.
- **Alternatives:** Invalid filters are ignored; empty results offer reset/consultation; `Contact us` tuition sorts last.
- **Postcondition:** URL represents current valid state; contextual consultation retains Program and university IDs.
- **Traceability:** FR-PRG-001–012, FR-SRCH-001–006.

### UC-04 — Read news and guidance

- **Primary actor:** Visitor
- **Preconditions:** Bilingual Published article exists.
- **Main flow:** Visitor opens news list/detail, reads localized content, and navigates to related/latest content.
- **Postcondition:** Page exposes correct author/date, canonical metadata, and eligible structured data.
- **Traceability:** FR-CNT-001–005, FR-SEO-001–008.

### UC-05 — Submit free-consultation request

- **Primary actor:** Visitor
- **Preconditions:** Consultation form is available; no account is required.
- **Main flow:** Visitor completes required and optional fields, accepts privacy/contact terms, and submits; server validates, normalizes mobile, checks duplicates, atomically stores lead/outbox, creates reference, and returns success.
- **Alternatives:** Validation errors map to fields; duplicate returns existing reference; transient UI/network error preserves non-sensitive values; Noura outage does not change successful local acceptance.
- **Postcondition:** Exactly one accepted local lead exists with source/consent data and `Pending` sync state.
- **Traceability:** FR-LEAD-001–013, FR-NOURA-001–007.

### UC-06 — Authenticate administrative user

- **Primary actor:** Administrative user
- **Preconditions:** Active account exists.
- **Main flow:** User submits email/password; server verifies password and lock state; a secure session is established and user reaches authorized panel areas.
- **Alternatives:** Invalid attempts are recorded; five failures lock the account for 15 minutes; forgotten password uses a single-use expiring email link.
- **Postcondition:** Authenticated server-owned session exists or access is denied generically.
- **Traceability:** FR-ADM-001–004, SEC-001–007.

### UC-07 — Manage bilingual content

- **Primary actor:** Content Editor or Super Admin
- **Preconditions:** Authorized authenticated session.
- **Main flow:** Actor creates/edits an entity, supplies Persian/English and SEO fields, uploads valid media, previews, and publishes.
- **Alternatives:** Missing translation/SEO blocks publication; dependent Published content can be archived but not destructively deleted.
- **Postcondition:** Published entity is publicly available in both locales and eligible for sitemap inclusion.
- **Traceability:** FR-LOC-004–005, FR-UNI-001–008, FR-PRG-001–012, FR-CNT-001–005, BR-CNT-001–006.

### UC-08 — Qualify and assign a lead

- **Primary actor:** Support or Super Admin
- **Preconditions:** Authenticated actor and accepted lead.
- **Main flow:** Actor finds lead, reviews context, records contact/notes, assigns one consultant, and updates status.
- **Alternatives:** Actor reassigns to a different consultant; previous assignment remains in history.
- **Postcondition:** Lead, status history, assignment history, and audit log are consistent.
- **Traceability:** FR-OPS-001–007.

### UC-09 — Consultant handles assigned lead

- **Primary actor:** Consultant
- **Preconditions:** Lead is currently assigned to the consultant.
- **Main flow:** Consultant opens assigned list/detail, records contact outcome/note, and performs an allowed status change.
- **Alternative:** Access to another consultant's lead is denied even if its identifier is known.
- **Postcondition:** Authorized changes and audit data are saved.
- **Traceability:** FR-OPS-001, FR-OPS-004–006, SEC-005.

### UC-10 — Synchronize lead with Noura

- **Primary actor:** Background Worker
- **Preconditions:** Pending outbox event exists.
- **Main flow:** Worker claims event, sends versioned payload/idempotency key, receives success, stores external ID, and marks sync `Synced`.
- **Alternatives:** Retryable failure schedules the next configured attempt; permanent/exhausted failure marks `Failed` with sanitized error.
- **Postcondition:** Delivery state is durable and no duplicate provider lead is produced by retry.
- **Traceability:** FR-NOURA-001–007, NFR-REL-001.

### UC-11 — Manually retry failed Noura synchronization

- **Primary actor:** Support or Super Admin
- **Preconditions:** Lead sync state is `Failed` and actor is authorized.
- **Main flow:** Actor requests retry; system audit logs the action and queues an idempotent retry.
- **Postcondition:** Sync returns to an actionable pending state without duplicating the local/provider lead.
- **Traceability:** FR-NOURA-004–007, BR-NOURA-004.

### UC-12 — Anonymize eligible lead

- **Primary actor:** Super Admin or authorized privacy operator
- **Preconditions:** Verified data-subject request and no overriding retention obligation.
- **Main flow:** Actor initiates anonymization; system irreversibly removes/replaces identifying fields while retaining permitted aggregate/operational evidence and an audit event.
- **Postcondition:** Request is completed within 30 days and the lead cannot be reconstructed from application data.
- **Traceability:** FR-OPS-006–007, NFR-PRV-001–002, SEC-013–015.

## 8. Constraints

### 8.1 Product constraints

- The delivery team currently consists of the project owner working with Codex; the architecture shall favor a modular monolith over microservices.
- Public accounts and all Post-MVP features shall not delay MVP acceptance.
- Initial country, university, Program, and news counts are not yet fixed; the system must remain pagination-driven.
- Content is entered manually in MVP; bulk university/Program import is excluded.
- Both translations must be prepared before publication.

### 8.2 Technical constraints

The detailed deployment topology, service responsibilities, trust boundaries, data ownership, asynchronous processing, failure behavior, and scaling rules are governed by [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

- Architecture: separate Next.js Web and FastAPI API deployments; FastAPI remains a domain-oriented modular monolith until measured scaling or organizational requirements justify extraction.
- Web: Next.js App Router with strict TypeScript on Node.js 24 LTS; pnpm manages JavaScript dependencies.
- Backend: Python 3.12 feature version locked to `>=3.12,<3.13`, FastAPI, Pydantic v2, and Uvicorn; uv manages Python dependencies and lock state. Patch upgrades within Python 3.12 are permitted, but changing the Python feature version requires explicit Product Owner approval, an ADR, a dependency compatibility audit, and full regression testing.
- UI: React, Tailwind CSS, accessible reusable components, and project design tokens.
- Localization: locale-prefixed routing compatible with `next-intl` semantics.
- Validation: Zod may validate Web interactions, but Pydantic request schemas and domain rules are server-authoritative.
- Database: PostgreSQL 18 with SQLAlchemy 2, Alembic, and asyncpg.
- Database modeling: entity boundaries and aggregate ownership follow [DATABASE_DESIGN.md](./DATABASE_DESIGN.md). The authorized baseline migrations may proceed, while new domain-expanding revisions require their ERD relationship and physical column matrix to be documented first.
- Database implementation: the current executable migration baseline and verified revision head are governed by [DATABASE_IMPLEMENTATION.md](./DATABASE_IMPLEMENTATION.md).
- Authentication: FastAPI-owned staff sessions; Argon2id passwords; short-lived signed access JWTs plus rotating, hashed, server-tracked opaque refresh tokens for public users; email verification/reset; CSRF protection; OTP/OAuth provider adapters; server-enforced RBAC; and a privileged-role MFA path.
- Cache/queue: Redis 8 for reconstructable cache, session acceleration, rate limits, OTP state, locks, and Celery transport; it is not the sole store for business records.
- Background processing: Celery workers and Celery Beat plus a PostgreSQL transactional outbox for critical atomic DB-to-job delivery.
- Files: private S3-compatible object storage with short-lived presigned access, malware scanning, and CDN delivery as appropriate.
- API: OpenAPI 3.1 JSON under `/api/v1`; generated TypeScript client; UTC timestamps; stable English enums; money represented using precise decimals/minor units and ISO currencies.
- Deployment: independent immutable Web, API, Worker, and Scheduler containers behind Caddy or a managed ingress.

### 8.3 External constraints and dependencies

- Noura documentation, sandbox credentials, field mapping, authentication, rate limits, and error contract are not yet available; expected testing is no earlier than 15 Mehr 1405.
- Final domain, DNS, hosting, managed PostgreSQL, storage, production email, monitoring, and backup destinations remain external dependencies.
- Production deployment and real Noura acceptance are conditional on timely delivery of those dependencies.
- Until then, local/staging plus the versioned mock connector is the testable integration baseline.

### 8.4 UX constraints

- Approved AI screens, the supplied consultation screenshot, and ApplyICA are layout references rather than content sources or pixel-perfect specifications.
- The supplied Jahan Academy logo controls where reference images disagree.
- Placeholder facts, rankings, prices, statistics, testimonials, and imagery shall not be published as verified content.

## 9. Acceptance Criteria

### 9.1 Release-level acceptance

| ID | Acceptance criterion | Evidence |
|---|---|---|
| AC-REL-001 | All P0 requirements are implemented or recorded as an approved external-dependency exception. | Requirements traceability and signed UAT report |
| AC-REL-002 | Formatting, lint, TypeScript checking, unit/integration tests, production build, and migration validation pass. | CI/build report |
| AC-REL-003 | No Critical or High-severity security defect remains open; any Medium defect has documented disposition. | Security review and issue register |
| AC-REL-004 | Local setup and production-like staging setup are reproducible from documentation. | Clean-environment installation test |
| AC-REL-005 | Backup and restore procedure meets stated RPO/RTO in a rehearsal. | Timestamped restore report |

### 9.2 Functional acceptance

| ID | Given / When / Then |
|---|---|
| AC-FUNC-001 | **Given** equivalent Published content, **when** locale is switched, **then** the corresponding `/fa` or `/en` page opens with correct direction and no fallback-language content. |
| AC-FUNC-002 | **Given** incomplete required Persian or English fields, **when** an editor publishes, **then** publication is blocked with field-level errors. |
| AC-FUNC-003 | **Given** valid search/filter/sort input, **when** state changes, **then** URL parameters update, page resets to 1, and reloading reproduces the same result state. |
| AC-FUNC-004 | **Given** an invalid filter value, **when** the list loads, **then** the value is ignored safely and no 5xx response occurs. |
| AC-FUNC-005 | **Given** a Program with exact/range/contact tuition, **when** saved and listed, **then** validation and sorting follow BR-PRG-001–004. |
| AC-FUNC-006 | **Given** a valid consultation request, **when** submitted, **then** exactly one local lead and outbox event are committed and a non-sequential reference is returned. |
| AC-FUNC-007 | **Given** the same normalized mobile/country/intake/year within 24 hours, **when** resubmitted, **then** the existing reference and `duplicate: true` are returned without a new lead/outbox create event. |
| AC-FUNC-008 | **Given** Noura is unavailable, **when** a valid request is submitted, **then** the visitor still receives success after local persistence and the event remains retryable. |
| AC-FUNC-009 | **Given** optional age/gender/occupation/marital/budget are omitted or `Prefer not to say`, **when** other required fields are valid, **then** the request is accepted. |
| AC-FUNC-010 | **Given** consultation starts on a Program/university page, **when** accepted, **then** trusted context identifiers are stored without relying on visitor-entered names. |
| AC-FUNC-011 | **Given** a consultant knows an unassigned lead ID, **when** requesting it, **then** the server returns an authorization-safe denial and exposes no lead data. |
| AC-FUNC-012 | **Given** a lead is reassigned, **when** the transaction completes, **then** exactly one consultant is current and prior assignment history remains queryable. |
| AC-FUNC-013 | **Given** a retryable Noura failure, **when** the worker processes it, **then** retry timing, attempt count, sanitized error, and final state are stored durably. |
| AC-FUNC-014 | **Given** Published content is archived, **when** crawlers/users request it, **then** it is absent from sitemap and follows the configured redirect/404/410 policy. |

### 9.3 UX and accessibility acceptance

| ID | Acceptance criterion |
|---|---|
| AC-UX-001 | Consultation form renders two columns at suitable desktop width and one column on narrow screens with no horizontal overflow. |
| AC-UX-002 | All controls have persistent localized labels, visible focus, accessible errors, logical keyboard order, and programmatic required/invalid state. |
| AC-UX-003 | Persian and English layouts mirror visually without reversing semantic tab order or using incorrect directional icons. |
| AC-UX-004 | Loading, empty, error, success, disabled, and in-flight states are present for critical lists and forms. |
| AC-UX-005 | Automated checks and manual keyboard/screen-reader sampling find no blocking WCAG 2.2 AA issue in the critical paths. |

### 9.4 External-dependency acceptance exceptions

- The real Noura connector cannot be accepted until documentation, credentials, and a test environment are supplied; the mock contract and worker behavior remain mandatory.
- Production deployment cannot be accepted until domain, hosting, database, storage, TLS/DNS, email, monitoring, and backup destinations are supplied.
- These exceptions do not waive local/staging implementation, tests, documentation, or connector interfaces.

## 10. Security Requirements

| ID | Requirement |
|---|---|
| SEC-001 | Enforce HTTPS in staging/production and use `HttpOnly`, `Secure`, and appropriate `SameSite` cookies. |
| SEC-002 | Hash passwords using Argon2id or an equivalent modern adaptive algorithm; plaintext/reversible storage is prohibited. |
| SEC-003 | Require admin passwords of at least 12 characters; reset tokens shall be random, hashed at rest, single-use, and expire within 30 minutes. |
| SEC-004 | Lock an admin account for 15 minutes after five failed attempts and record the event without submitted secrets. |
| SEC-005 | Enforce RBAC and lead ownership scope in server routes, services, and database queries. |
| SEC-006 | Protect state-changing browser requests from CSRF according to the selected session design. |
| SEC-007 | Rate-limit login, reset, consultation submission, and other abuse-sensitive endpoints by appropriate combinations of IP/account/identifier. |
| SEC-008 | Validate/normalize all input, encode output, and sanitize rich text through an explicit allowlist. |
| SEC-009 | Use parameterized ORM/database access; untrusted SQL concatenation is prohibited. |
| SEC-010 | Restrict upload type/size, inspect actual content, randomize storage keys, and reject executable or mismatched files. |
| SEC-011 | Keep secrets in environment/secret management and out of source control, logs, and client bundles. |
| SEC-012 | Encrypt data in transit and use managed encryption at rest in production where available. |
| SEC-013 | Redact passwords, tokens, complete provider payloads, and unnecessary PII from logs and audit diffs. |
| SEC-014 | Encrypt and access-control backups; only authorized operators may restore them. |
| SEC-015 | Store consent timestamp and policy version with every accepted lead. |
| SEC-016 | Run dependency, static-analysis, and secret-scanning checks before production delivery. |
| SEC-017 | Return generic production errors to clients; keep diagnostic detail in protected server logs with correlation IDs. |

### 10.1 Security verification

- Automated authorization tests shall cover every administrative role and direct-object access attempt.
- Authentication tests shall cover lockout, session expiry, logout, reset expiry, reuse prevention, and inactive accounts.
- Consultation tests shall cover validation bypass, rate limiting, injection payloads, duplicate abuse, and consent enforcement.
- Upload tests shall cover oversized, executable, MIME-mismatched, and malicious filenames/content.
- Dependency and secret scans shall run in CI; production configuration shall undergo a manual checklist review.

## 11. Performance Requirements

### 11.1 User-experience targets

- Lighthouse Performance shall be at least 90 for representative homepage, university list/detail, Program list/detail, and consultation pages using an agreed mobile profile against production-like staging.
- Field data targets at the 75th percentile are LCP < 2.5 seconds, INP < 200 milliseconds, and CLS < 0.1.
- Below-fold images shall lazy-load; critical above-fold hero media shall be optimized and loaded with correct priority.
- Lists shall be server-paginated and shall never fetch the unbounded full dataset for public rendering.

### 11.2 API and worker targets

- Baseline performance tests shall report p50, p95, error rate, throughput, and database saturation for public list/detail, consultation submission, admin list, and worker delivery paths.
- Under the baseline concurrency target, valid requests shall not lose or duplicate data and the unexpected 5xx rate shall remain below 1% excluding injected dependency failures.
- Consultation acceptance latency shall exclude completion of the asynchronous Noura call; local persistence must not wait for provider availability.
- Performance budgets shall be measured after a production-like dataset and hosting environment exist; stricter endpoint latency thresholds may then be baselined without weakening Web Vitals targets.

### 11.3 Performance test conditions

- Tests shall use representative image weights, bilingual content, realistic pagination, and seeded universities/Programs/leads.
- Cold-cache and warm-cache results shall be reported separately.
- Performance failures caused by an external provider shall be distinguishable from application/database failures.

## 12. Scalability Requirements

- The initial deployment shall support at least 100 concurrent public users and 20 concurrent panel users in baseline load testing without lost writes, duplicate leads, authorization leakage, or material error-rate degradation.
- University, Program, news, and lead datasets shall not use a product-level hard maximum; access shall use pagination, indexes, selective queries, and bounded response sizes.
- Public page size is fixed at a maximum of 20 items; internal panel requests are capped at 100 items.
- Stateless web instances shall be possible; sessions, durable work, and authoritative state shall not depend on local process memory.
- The Noura worker shall scale independently of the web process and use safe job claiming/locking so multiple workers do not deliver the same event concurrently.
- Provider rate limits shall be isolated in the adapter/worker and handled through backoff, retry scheduling, concurrency controls, and idempotency.
- Media shall be stored behind an adapter compatible with object storage and CDN delivery; application instances shall not rely on local disk in production.
- Database indexes shall cover publication/status filters, localized discovery joins/search, Program taxonomies/tuition, lead deduplication, assignments, status/sync state, and outbox scheduling.
- Scaling shall begin vertically and through query/index optimization; additional web/worker instances may be introduced without decomposing the modular monolith.
- Capacity thresholds and alerts shall be refined after production baselines for CPU, memory, connection pool, query latency, queue age, storage growth, and error rate.

## 13. Traceability and Change Control

| Requirement group | Primary use cases | Primary acceptance coverage |
|---|---|---|
| FR-LOC, FR-HOME, FR-SEO | UC-01 | AC-FUNC-001–002, AC-FUNC-014, AC-UX-003 |
| FR-UNI, FR-SRCH | UC-02 | AC-FUNC-003–004, AC-UX-004 |
| FR-PRG, FR-SRCH | UC-03 | AC-FUNC-003–005, AC-UX-004 |
| FR-CNT, FR-MED | UC-04, UC-07 | AC-FUNC-002, AC-FUNC-014 |
| FR-LEAD | UC-05 | AC-FUNC-006–010, AC-UX-001–002 |
| FR-OPS | UC-08, UC-09, UC-12 | AC-FUNC-011–012 |
| FR-NOURA | UC-10, UC-11 | AC-FUNC-006, AC-FUNC-008, AC-FUNC-013 |
| FR-ADM, SEC | UC-06–09 | AC-REL-003, AC-FUNC-011–012 |
| NFR-PERF, NFR-SCALE | All public/admin paths | Performance and scalability test reports |
| NFR-BCK, NFR-PRV | UC-12 and operations | AC-REL-005 and privacy request evidence |

Any scope or behavioral change shall:

1. Be approved and recorded first in `PROJECT_CONTEXT.md`.
2. Update the affected SRS requirements, use cases, acceptance criteria, schema/API documentation, and tests.
3. Preserve stable IDs where semantics remain compatible; incompatible changes receive a new ID or explicit version note.
4. Record effects on MVP priority, schedule, security, privacy, content, Noura mapping, and production dependencies.
