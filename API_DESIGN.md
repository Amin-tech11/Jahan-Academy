# Jahan Academy — API Design and Contracts

## 1. Contract Status

This document is the human-readable contract for API version 1. The machine-readable baseline is
`backend/openapi/api-v1.yaml`. API implementation must conform to these contracts; changing a
request, response, status code, enum, permission, or validation rule requires changing the contract
and contract tests first.

Endpoints are marked:

- **MVP:** required for the public discovery, consultation, content, and Admin release.
- **Final:** approved complete-product contract implemented after the relevant product phase.
- **External:** provider-facing endpoint with provider authentication rather than a user session.

## 2. Global Protocol

| Concern | Contract |
|---|---|
| Base path | `/api/v1` |
| Media type | `application/json; charset=utf-8`, except file transfer and CSV export |
| Field style | JSON fields use `camelCase`; URL query fields use `camelCase` |
| Identifiers | UUID v4/v7 serialized as lowercase strings; public lead reference is opaque and non-sequential |
| Time | ISO 8601 UTC such as `2026-09-22T09:30:00Z` |
| Date | ISO 8601 calendar date such as `2027-09-01` |
| Money | Decimal string plus ISO 4217 currency; never binary floating point |
| Locale | `fa` or `en`; localized public endpoints require `locale`, defaulting to `fa` |
| Pagination | `page` defaults to 1; `limit` defaults to 20 and is limited to 1–100 |
| Sorting | Allowlisted values only; prefix `-` means descending where supported |
| Unknown fields | Rejected on mutation requests with `VALIDATION_ERROR` |
| Request tracing | Server accepts/generates `X-Request-ID` and returns it in response headers/errors |
| Idempotency | `Idempotency-Key` is required for order/application creation and recommended for other retried POSTs |
| Concurrency | Admin updates send `If-Match` with the current ETag; stale updates return `412` |

### 2.1 Successful Responses

Single resource:

```json
{
  "data": {
    "id": "0199...",
    "createdAt": "2026-09-22T09:30:00Z",
    "updatedAt": "2026-09-22T09:30:00Z"
  }
}
```

Collection:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

Mutations returning no representation use `204 No Content`.

### 2.2 Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Localized safe message",
    "fieldErrors": { "mobile": ["INVALID_PHONE"] },
    "requestId": "01K..."
  }
}
```

| HTTP | Stable codes |
|---:|---|
| 400 | `INVALID_REQUEST`, `INVALID_STATE_TRANSITION`, `INVALID_FILTER` |
| 401 | `AUTHENTICATION_REQUIRED`, `INVALID_CREDENTIALS`, `SESSION_EXPIRED` |
| 403 | `PERMISSION_DENIED`, `CSRF_FAILED`, `ACCOUNT_LOCKED`, `ACCOUNT_INACTIVE` |
| 404 | `RESOURCE_NOT_FOUND` |
| 409 | `RESOURCE_CONFLICT`, `SLUG_TAKEN`, `IDENTITY_ALREADY_EXISTS`, `DUPLICATE_OPERATION` |
| 412 | `VERSION_MISMATCH` |
| 413 | `FILE_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | `VALIDATION_ERROR` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |
| 502 | `PROVIDER_ERROR` |
| 503 | `DEPENDENCY_UNAVAILABLE` |

Errors never expose SQL, stack traces, secrets, Noura payloads, or whether an unrelated email/mobile
exists. Authentication recovery returns a neutral response where enumeration is possible.

## 3. Authentication and Authorization

| Auth mode | Contract |
|---|---|
| Guest | No credential; public published resources only |
| Staff session | Opaque `HttpOnly`, `Secure`, `SameSite=Lax` cookie; required for Admin APIs |
| User access | Short-lived HS256 JWT in `Authorization: Bearer`; required claims include `sub`, `sid`, `jti`, `iss`, `aud`, `iat`, `nbf`, `exp`, and `typ=access` |
| User refresh | Opaque random token in an HttpOnly cookie; only its SHA-256 hash is stored; rotated on every refresh |
| CSRF | `X-CSRF-Token` required for session-authenticated `POST`, `PUT`, `PATCH`, `DELETE` |
| Provider signature | Payment/webhook-specific signature and replay-window validation |

Permissions are server-enforced. The following codes are reserved design candidates; their final
role assignments are controlled by `AUTHORIZATION_DESIGN.md` and remain pending approval:

`catalog.read`, `catalog.write`, `content.read`, `content.write`, `content.publish`, `lead.read.all`,
`lead.read.assigned`, `lead.write.all`, `lead.write.assigned`, `lead.assign`, `lead.sync.retry`,
`identity.manage`, `role.manage`, `audit.read`, `report.export`, `application.manage`,
`commerce.manage`, and `learning.manage`.

The approved MVP behavior still requires Super Admin administration, Support lead operations,
assigned-only Consultant access, and direct publishing by Content Editor. Exact grants, scopes,
field visibility, and final-product roles are not seeded until the authorization matrix is approved.

## 4. Shared Schemas and Validation

### 4.1 Public Resources

| Schema | Required fields and validation |
|---|---|
| `CountrySummary` | `id`, shared lowercase English `slug`, localized `name`, ISO alpha-2 `code`, optional `image`, `featured` |
| `UniversitySummary` | `id`, `slug`, localized `name/summary`, country, city, institution type, optional ranking and image |
| `UniversityDetail` | Summary plus localized body, founded year, website, gallery, costs, rankings, FAQs, related programs/articles |
| `ProgramSummary` | `id`, `slug`, university, localized `name/summary`, level, field, duration, language, tuition discriminator |
| `ProgramDetail` | Summary plus admission requirements, official URL, application fee, intakes/deadlines, FAQs and related programs |
| `ArticleSummary` | `id`, `slug`, localized title/excerpt, cover image, published time, categories |
| `ArticleDetail` | Summary plus sanitized localized body, author display data, SEO and related content |

Tuition is a tagged union: `EXACT(amount,currency)`, `RANGE(minimum,maximum,currency)`, or
`CONTACT`; amounts are non-negative decimal strings and `minimum <= maximum`.

### 4.2 Consultation

`ConsultationCreate`:

| Field | Required | Validation |
|---|---:|---|
| `firstName`, `lastName` | Yes | Trimmed, 1–100 Unicode characters |
| `mobile` | Yes | Iranian or international input normalized to E.164; maximum 32 raw characters |
| `email` | No | Valid email, normalized lowercase, maximum 254 |
| `desiredCountryId` | No | Existing published/configured country UUID |
| `desiredCountryText` | Conditional | 1–100 characters when no ID represents the answer |
| `intakeTerm` | Yes | `SPRING`, `SUMMER`, `FALL`, `WINTER`, `UNKNOWN` |
| `startYear` | Yes | Current year through current year + 10 |
| `age` | No | Integer 18–100 |
| `gender` | No | Configured stable code including `PREFER_NOT_TO_SAY` |
| `genderSelfDescription` | Conditional | Maximum 100; accepted only for the configured self-description code |
| `occupation` | No | Trimmed, maximum 120 |
| `maritalStatus` | No | Configured stable code including `PREFER_NOT_TO_SAY` |
| `investmentBudget` | No | Active range code and matching ISO 4217 currency |
| `message` | No | Maximum 2,000 characters; plain text |
| `locale` | Yes | `fa` or `en` |
| `source.pageUrl` | Yes | Same-site relative URL, maximum 2,048 |
| `source.entityType` | No | `UNIVERSITY` or `PROGRAM` |
| `source.entityId` | Conditional | Existing public entity matching `entityType` |
| `privacyConsent`, `contactConsent` | Yes | Must both be `true`; consent version/time/IP captured server-side |

`ConsultationReceipt` contains `reference`, `duplicate`, `receivedAt`, and localized `message`.
Duplicate detection uses normalized mobile + desired country + intake + start year within 24 hours.

### 4.3 Authentication

| Schema | Fields and validation |
|---|---|
| `StaffLogin` | `email` valid/max 254; `password` 8–128 raw characters |
| `PasswordResetRequest` | `email`; response is always neutral |
| `PasswordResetConfirm` | single-use token and new password satisfying current password policy |
| `OtpRequest` | E.164-capable mobile and purpose; rate-limited |
| `OtpVerify` | challenge ID and fixed-length code; limited attempts and expiry |
| `UserRegister` | name, verified identity proof, locale, accepted legal versions |

### 4.4 Applicant and Application

| Schema | Fields and validation |
|---|---|
| `ApplicantProfilePatch` | Only supplied fields update; birth date must imply age ≥ 18 unless policy changes; ISO country/citizenship IDs |
| `EducationInput` | level, institution, country, field, start/end year, graduation state, grade value and scale; chronological consistency |
| `LanguageTestInput` | test type, status, optional component scores, test/expiry dates and evidence document; score range per test type |
| `ApplicationCreate` | `programId`, `intakeId`; both published/open and related; one active duplicate prohibited |
| `ApplicationPatch` | Applicant-editable draft data only; submitted/review states reject protected changes |
| `ApplicationSubmit` | required declarations and current version; all mandatory requirements satisfied |

### 4.5 Commerce and Learning

| Schema | Fields and validation |
|---|---|
| `OrderCreate` | One or more active product/price IDs; server calculates all totals; ISO currency must match price |
| `PaymentIntentCreate` | Payable order owned by caller; provider allowlisted; idempotency required |
| `CourseProgressPatch` | Enrolled user, lesson belongs to course, progress 0–100, monotonic unless staff correction |

## 5. MVP Public API

Each public read returns only `PUBLISHED`, non-archived records with complete `fa` and `en`
translations.

| ID | Method and endpoint | Auth | Request | Response | Status / errors | Permission and validation |
|---|---|---|---|---|---|---|
| PUB-01 | `GET /countries` | Guest | Query: `locale`, `featured?`, `page`, `limit` | Page of `CountrySummary` | `200`; `422 INVALID_FILTER` | Public; allowlisted filters |
| PUB-02 | `GET /countries/{slug}` | Guest | Path slug; query `locale` | `CountryDetail` | `200`, `404 RESOURCE_NOT_FOUND` | Published only; slug regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| PUB-03 | `GET /universities` | Guest | `locale,q,country,city,type,ranking,sort,page,limit` | Page of `UniversitySummary` | `200`; `422 INVALID_FILTER` | Public; `q` 2–100; allowlisted sort/filter values |
| PUB-04 | `GET /universities/{slug}` | Guest | Slug and `locale` | `UniversityDetail` | `200`, `404` | Published only; related items are also public |
| PUB-05 | `GET /programs` | Guest | `locale,q,country,university,level,field,language,intake,tuitionMin,tuitionMax,currency,sort,page,limit` | Page of `ProgramSummary` | `200`; `422 INVALID_FILTER` | Ranges non-negative/min≤max; allowlisted sort |
| PUB-06 | `GET /programs/{slug}` | Guest | Slug and `locale` | `ProgramDetail` | `200`, `404` | Published only; full structured facts in MVP |
| PUB-07 | `GET /articles` | Guest | `locale,q,category,tag,page,limit` | Page of `ArticleSummary` newest first | `200`; `422` | Published and `publishedAt <= now` |
| PUB-08 | `GET /articles/{slug}` | Guest | Slug and `locale` | `ArticleDetail` | `200`, `404` | Sanitized published body only |
| PUB-09 | `POST /consultation-requests` | Guest | `ConsultationCreate`; optional `Idempotency-Key` | `ConsultationReceipt` | `201`; duplicate `200`; `409 IDEMPOTENCY_KEY_REUSED`; `422`; `429`; `503` only if local persistence unavailable | Public; honeypot/rate limit; persist lead+outbox atomically; Noura failure never changes acceptance |

## 6. MVP Staff Authentication API

| ID | Method and endpoint | Auth | Request | Response | Status / errors | Permission and validation |
|---|---|---|---|---|---|---|
| ADM-A01 | `POST /admin/auth/login` | Guest | `StaffLogin` + CSRF bootstrap context | `StaffSessionView`; sets session and CSRF cookies | `200`; `401 INVALID_CREDENTIALS`; `403 ACCOUNT_LOCKED/INACTIVE`; `429` | Active staff; enumeration-safe; lockout policy |
| ADM-A02 | `POST /admin/auth/logout` | Staff | CSRF header | Empty | `204`; `401`; `403 CSRF_FAILED` | Current session; revokes server-side session |
| ADM-A03 | `GET /admin/auth/me` | Staff | None | `StaffView` with effective permissions | `200`; `401 SESSION_EXPIRED` | Any active staff |
| ADM-A04 | `POST /admin/auth/password-reset-requests` | Guest | `PasswordResetRequest` | Neutral acknowledgement | `202`; `429` | Always same response; active staff receives expiring link |
| ADM-A05 | `POST /admin/auth/password-resets` | Guest | `PasswordResetConfirm` | Empty; revokes existing sessions | `204`; `400 TOKEN_INVALID/EXPIRED/USED`; `422`; `429` | Valid single-use token and password policy |

## 7. MVP Admin Content and Catalog API

All mutations require Staff session + CSRF + relevant permission. `PUT` replaces the editable
representation; `PATCH` changes supplied fields. Translations for both locales are required before
publication. Delete means hard delete only for dependency-free drafts; otherwise use archive.

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| REF-01 | `GET /reference-data/{kind}` | `kind`, `locale`, `q`, relation filters, page/limit | Localized active `ReferencePage` | `200`, `422` | Guest |
| REF-02 | `GET /admin/reference-data/{kind}` | Locale/search/relation filters/page | All active and archived items | `200`; `401`; `403`; `422` | `reference_data.read` |
| REF-03 | `POST /admin/reference-data/{kind}` | Kind-specific write model with complete `fa`/`en` translations | `ReferenceItem` | `201`; `409 REFERENCE_DATA_ALREADY_EXISTS`; `422` | `reference_data.write` |
| REF-04 | `GET /admin/reference-data/{kind}/{id}` | UUID | Item with both translations | `200`; `404` | `reference_data.read` |
| REF-05 | `PUT /admin/reference-data/{kind}/{id}` | Complete kind-specific write model + `If-Match` | Updated item + new ETag | `200`; `404`; `409`; `412`; `422`; `428` | `reference_data.write` |
| REF-06 | `DELETE /admin/reference-data/{kind}/{id}` | UUID + `If-Match` | Archived item + new ETag | `200`; `404`; `412`; `428` | `reference_data.write` |
| CAT-01 | `GET /admin/countries` | Filters, lifecycle, page/limit | Page of `AdminCountry` | `200`, `422` | `catalog.read` |
| CAT-02 | `POST /admin/countries` | `CountryWrite` | `AdminCountry` | `201`; `409 SLUG_TAKEN`; `422` | `catalog.write` |
| CAT-03 | `GET /admin/countries/{id}` | UUID | `AdminCountry` | `200`, `404` | `catalog.read` |
| CAT-04 | `PUT /admin/countries/{id}` | `CountryWrite`, `If-Match` | `AdminCountry` | `200`; `404`; `409`; `412`; `422` | `catalog.write` |
| CAT-05 | `POST /admin/countries/{id}/publish` | `If-Match` | `AdminCountry` | `200`; `409 PUBLICATION_INCOMPLETE`; `412` | `catalog.write` |
| CAT-06 | `POST /admin/countries/{id}/archive` | Optional reason, `If-Match` | `AdminCountry` | `200`; `409 INVALID_STATE_TRANSITION`; `412` | `catalog.write` |
| CAT-07 | `DELETE /admin/countries/{id}` | Draft UUID, `If-Match` | Empty | `204`; `409 RESOURCE_HAS_DEPENDENCIES`; `412` | `catalog.write` |
| UNI-01 | `GET /admin/universities` | Search/filter/status/page | Page of `AdminUniversity` | `200`, `422` | `catalog.read` |
| UNI-02 | `POST /admin/universities` | `UniversityWrite` | `AdminUniversity` | `201`; `409`; `422` | `catalog.write` |
| UNI-03 | `GET /admin/universities/{id}` | UUID | `AdminUniversity` | `200`, `404` | `catalog.read` |
| UNI-04 | `PUT /admin/universities/{id}` | `UniversityWrite`, `If-Match` | `AdminUniversity` | `200`; `404`; `409`; `412`; `422` | `catalog.write` |
| UNI-05 | `POST /admin/universities/{id}/publish` | `If-Match` | `AdminUniversity` | `200`; `409 PUBLICATION_INCOMPLETE`; `412` | `catalog.write` |
| UNI-06 | `POST /admin/universities/{id}/archive` | Reason, `If-Match` | `AdminUniversity` | `200`; `409`; `412` | `catalog.write` |
| UNI-07 | `DELETE /admin/universities/{id}` | Draft UUID, `If-Match` | Empty | `204`; `409 RESOURCE_HAS_DEPENDENCIES`; `412` | `catalog.write` |
| PRG-01 | `GET /admin/programs` | Search/filter/status/page | Page of `AdminProgram` | `200`, `422` | `catalog.read` |
| PRG-02 | `POST /admin/programs` | `ProgramWrite` | `AdminProgram` | `201`; `409`; `422` | `catalog.write` |
| PRG-03 | `GET /admin/programs/{id}` | UUID | `AdminProgram` | `200`, `404` | `catalog.read` |
| PRG-04 | `PUT /admin/programs/{id}` | `ProgramWrite`, `If-Match` | `AdminProgram` | `200`; `404`; `409`; `412`; `422` | `catalog.write` |
| PRG-05 | `POST /admin/programs/{id}/publish` | `If-Match` | `AdminProgram` | `200`; `409 PUBLICATION_INCOMPLETE`; `412` | `catalog.write` |
| PRG-06 | `POST /admin/programs/{id}/archive` | Reason, `If-Match` | `AdminProgram` | `200`; `409`; `412` | `catalog.write` |
| PRG-07 | `DELETE /admin/programs/{id}` | Draft UUID, `If-Match` | Empty | `204`; `409 RESOURCE_HAS_DEPENDENCIES`; `412` | `catalog.write` |
| ART-01 | `GET /admin/articles` | Search/status/category/page | Page of `AdminArticle` | `200`, `422` | `content.read` |
| ART-02 | `POST /admin/articles` | `ArticleWrite` | `AdminArticle` | `201`; `409`; `422` | `content.write` |
| ART-03 | `GET /admin/articles/{id}` | UUID | `AdminArticle` | `200`, `404` | `content.read` |
| ART-04 | `PUT /admin/articles/{id}` | `ArticleWrite`, `If-Match` | `AdminArticle` | `200`; `404`; `409`; `412`; `422` | `content.write` |
| ART-05 | `POST /admin/articles/{id}/publish` | Publish time optional, `If-Match` | `AdminArticle` | `200`; `409 PUBLICATION_INCOMPLETE`; `412` | `content.publish` |
| ART-06 | `POST /admin/articles/{id}/archive` | Reason, `If-Match` | `AdminArticle` | `200`; `409`; `412` | `content.write` |
| ART-07 | `DELETE /admin/articles/{id}` | Draft UUID, `If-Match` | Empty | `204`; `409`; `412` | `content.write` |
| FAQ-01 | `GET /admin/faqs` | Search/scope/status/page | Page of `AdminFaq` | `200`, `422` | `content.read` |
| FAQ-02 | `POST /admin/faqs` | `FaqWrite` | `AdminFaq` | `201`, `422` | `content.write` |
| FAQ-03 | `GET /admin/faqs/{id}` | UUID | `AdminFaq` | `200`, `404` | `content.read` |
| FAQ-04 | `PUT /admin/faqs/{id}` | `FaqWrite`, `If-Match` | `AdminFaq` | `200`; `404`; `412`; `422` | `content.write` |
| FAQ-05 | `DELETE /admin/faqs/{id}` | UUID, `If-Match` | Empty | `204`; `409`; `412` | `content.write` |

`CountryWrite`, `UniversityWrite`, `ProgramWrite`, `ArticleWrite`, and `FaqWrite` reject unknown
fields, require stable shared slugs, validate all referenced IDs, and store separate complete `fa`/`en`
translations. Publication additionally validates required SEO and domain fields.

`kind` is one of `countries`, `cities`, `academic-levels`, `fields-of-study`, `intakes`, or
`currencies`. Reference-data deletion is deliberately an archive operation: countries transition to
`archived`, while the other reference entities become inactive. Public reads expose only published
countries and active items. Every write records a safe before/after audit entry. Country catalog
endpoints below remain the richer country-content contract; the reference-data endpoints provide
the implemented shared lookup-management boundary.
Admin create/detail responses include an ETag derived from the row version. Update and archive
require that ETag in `If-Match`; stale writes fail atomically with `412 STALE_WRITE`.

## 8. MVP Media API

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| MED-01 | `POST /admin/media/upload-intents` | File name, MIME, byte size, purpose | Presigned upload URL, object key, expiry | `201`; `413`; `415`; `422` | Content/catalog write |
| MED-02 | `POST /admin/media/{id}/confirm` | Checksum and upload token | `MediaAsset` with `PROCESSING` state | `202`; `400 UPLOAD_INCOMPLETE`; `409`; `422` | Original intent owner or Super Admin |
| MED-03 | `GET /admin/media` | Search/type/state/page | Page of `MediaAsset` | `200`, `422` | `content.read` or `catalog.read` |
| MED-04 | `GET /admin/media/{id}` | UUID | `MediaAsset` | `200`, `404` | Authorized staff |
| MED-05 | `DELETE /admin/media/{id}` | UUID, `If-Match` | Empty | `204`; `409 RESOURCE_HAS_DEPENDENCIES`; `412` | Content/catalog write |

Uploaded files are not usable until checksum, type, size and malware checks pass.

## 9. MVP Lead Operations API

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| LEAD-01 | `GET /admin/leads` | `q,status,syncStatus,assigneeId,countryId,from,to,page,limit,sort` | Page of `LeadSummary` | `200`, `422` | Support/Super Admin see all; Consultant query is forcibly scoped to self |
| LEAD-02 | `GET /admin/leads/{id}` | UUID | `LeadDetail` | `200`; `403`; `404` | `lead.read.all` or currently assigned + `lead.read.assigned` |
| LEAD-03 | `PATCH /admin/leads/{id}` | Editable qualification fields, `If-Match` | `LeadDetail` | `200`; `403`; `404`; `412`; `422` | `lead.write.all`; Consultant cannot edit identity/source fields |
| LEAD-04 | `POST /admin/leads/{id}/assignments` | `consultantId`, optional reason, `If-Match` | `LeadDetail` | `200`; `404`; `409 CONSULTANT_UNAVAILABLE`; `412`; `422` | `lead.assign`; retains assignment history |
| LEAD-05 | `POST /admin/leads/{id}/status-transitions` | `toStatus`, optional reason, `If-Match` | `LeadDetail` | `200`; `400 INVALID_STATE_TRANSITION`; `403`; `412`; `422` | All-lead writer or assigned consultant; transition matrix enforced |
| LEAD-06 | `POST /admin/leads/{id}/notes` | Plain text 1–5,000, visibility `INTERNAL` | `LeadNote` | `201`; `403`; `404`; `422` | Support/Super Admin or assigned Consultant |
| LEAD-07 | `GET /admin/leads/{id}/history` | Page/limit | Page of immutable `LeadEvent` | `200`; `403`; `404` | Same scope as lead detail |
| LEAD-08 | `POST /admin/leads/{id}/archive` | Reason, `If-Match` | `LeadDetail` | `200`; `403`; `412`; `422` | `lead.write.all`; no permanent delete |
| LEAD-09 | `POST /admin/leads/{id}/anonymize` | Approved privacy request ID, `If-Match` | `202` operation receipt | `202`; `403`; `409 LEGAL_HOLD`; `412`; `422` | Super Admin/data-privacy permission only |
| LEAD-10 | `POST /admin/leads/{id}/noura-retry` | Optional operator note | `202` sync attempt receipt | `202`; `403`; `404`; `409 SYNC_NOT_RETRYABLE`; `429` | `lead.sync.retry`; idempotent and audited |
| LEAD-11 | `GET /admin/leads/export` | Same filters; `format=csv` | UTF-8 CSV stream or `202` export job | `200/202`; `403`; `422`; `429` | `report.export`; export audit logged |

Allowed status transitions are defined by policy, not arbitrary PATCH: `NEW -> ASSIGNED/CLOSED`,
`ASSIGNED -> CONTACTED/CLOSED`, `CONTACTED -> QUALIFIED/NOT_QUALIFIED/CLOSED`,
`QUALIFIED -> CONVERTED/NOT_QUALIFIED/CLOSED`, with controlled reopening by Support/Super Admin.

## 10. MVP Staff, Roles and Audit API

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| IAM-01 | `GET /admin/staff` | Search/status/role/page | Page of `StaffView` | `200`, `403`, `422` | `identity.manage` |
| IAM-02 | `POST /admin/staff` | Email, name, role IDs | `StaffView`; invitation/reset flow triggered | `201`; `409 IDENTITY_ALREADY_EXISTS`; `422` | Super Admin / `identity.manage` |
| IAM-03 | `GET /admin/staff/{id}` | UUID | `StaffView` | `200`, `403`, `404` | `identity.manage` |
| IAM-04 | `PATCH /admin/staff/{id}` | Name/active state, `If-Match` | `StaffView` | `200`; `403`; `404`; `409 LAST_SUPER_ADMIN`; `412`; `422` | `identity.manage` |
| IAM-05 | `PUT /admin/staff/{id}/roles` | Complete role ID set, `If-Match` | `StaffView` | `200`; `403`; `404`; `409 LAST_SUPER_ADMIN`; `412`; `422` | `role.manage` |
| IAM-06 | `GET /admin/roles` | Page/limit | Page of roles and permissions | `200`, `403` | `role.manage` |
| IAM-07 | `GET /admin/audit-logs` | Actor/action/resource/date/page filters | Page of immutable audit events | `200`; `403`; `422` | `audit.read`; no mutation endpoint exists |

## 11. Final Public User Authentication API

These endpoints are implemented as final-product infrastructure but remain outside MVP acceptance.
Email/password registration creates a pending account; login is prohibited until the single-use
email verification token is consumed. Access credentials are signed JWTs with a 15-minute default
lifetime. Refresh credentials are opaque random tokens stored only as SHA-256 hashes, delivered in
an HttpOnly cookie, rotated on every use, grouped in a session family, and revoked as a family when
reuse is detected. The readable CSRF cookie must match `X-CSRF-Token` for refresh/logout.

| ID | Method and endpoint | Auth | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|---|
| AUTH-01 | `POST /auth/register` | Guest | Email, strong password, names, locale, accepted terms/privacy versions | Pending registration receipt | `202`; `409 IDENTITY_ALREADY_EXISTS`; `422` | Creates `PENDING` user; Argon2id hash; queues/sends verification email |
| AUTH-02 | `POST /auth/email-verification-requests` | Guest | Email | Neutral acknowledgement | `202`; `422`; `429` | Enumeration-safe; invalidates earlier unused verification token |
| AUTH-03 | `POST /auth/email-verifications` | Guest | Single-use token | Access token/User; sets refresh and CSRF cookies | `200`; `400 EMAIL_VERIFICATION_TOKEN_INVALID`; `422`; `429` | Activates account; token stored hashed and expires after 24h by default |
| AUTH-04 | `POST /auth/login` | Guest | Email/password | Access token/User; sets refresh and CSRF cookies | `200`; `401 INVALID_CREDENTIALS`; `403 EMAIL_NOT_VERIFIED/ACCOUNT_LOCKED`; `422`; `429` | Active verified User; temporary lock after configured failures |
| AUTH-05 | `POST /auth/refresh` | Refresh cookie + CSRF | No body | Rotated access/refresh/CSRF credentials | `200`; `401 INVALID_REFRESH_TOKEN/REFRESH_TOKEN_REUSED`; `403 CSRF_FAILED`; `429` | One-time rotation; reuse revokes token family |
| AUTH-06 | `POST /auth/logout` | Access JWT + CSRF | No body | Empty; cookies cleared | `204`; `401`; `403` | Revokes current server-side session immediately |
| AUTH-07 | `POST /auth/password-reset-requests` | Guest | Email | Neutral acknowledgement | `202`; `422`; `429` | Enumeration-safe; verified emails receive expiring token |
| AUTH-08 | `POST /auth/password-resets` | Guest | Single-use token + strong new password | Empty; all sessions revoked | `204`; `400 PASSWORD_RESET_TOKEN_INVALID`; `422`; `429` | Token hash stored; default 30-minute expiry |
| AUTH-09 | `POST /auth/otp-requests` | Guest | `OtpRequest` | Challenge ID and masked destination | `202`; `422`; `429` | Planned mobile-auth extension |
| AUTH-10 | `POST /auth/otp-verifications` | Guest | `OtpVerify` | Verified identity token or User session | `200`; `400 OTP_INVALID/EXPIRED`; `429` | Planned mobile-auth extension |
| AUTH-11 | `POST /auth/google` | Guest | Authorization code + PKCE state | `UserView` or onboarding requirement | `200`; `400 OAUTH_INVALID`; `409 LINK_REQUIRES_PROOF`; `429` | Planned OAuth extension; never link by unverified text |
| USER-01 | `GET /users/me` | User | None | `UserView` | `200`, `401` | Own account only |
| USER-02 | `PATCH /users/me` | User | Name, locale, notification preferences, `If-Match` | `UserView` | `200`; `412`; `422` | Own editable fields only |
| USER-03 | `GET /users/me/sessions` | User | Page/limit | Page of active sessions | `200`, `401` | Own sessions only |
| USER-04 | `DELETE /users/me/sessions/{id}` | User | CSRF | Empty | `204`; `404` | Own session; current-session behavior explicit in response |

## 12. Final Applicant Profile API

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| APP-01 | `GET /applicant-profile` | None | Full profile with completeness | `200`, `401` | User owns profile |
| APP-02 | `PATCH /applicant-profile` | `ApplicantProfilePatch`, `If-Match` | Updated profile/completeness | `200`; `412`; `422` | Own profile |
| APP-03 | `POST /applicant-profile/educations` | `EducationInput` | Education record | `201`, `422` | Own profile |
| APP-04 | `PUT /applicant-profile/educations/{id}` | `EducationInput`, `If-Match` | Education record | `200`; `404`; `412`; `422` | Own record |
| APP-05 | `DELETE /applicant-profile/educations/{id}` | `If-Match` | Empty | `204`; `404`; `409 RESOURCE_IN_USE`; `412` | Own record; referenced snapshots preserved |
| APP-06 | `POST /applicant-profile/language-tests` | `LanguageTestInput` | Language test | `201`, `422` | Own profile |
| APP-07 | `PUT /applicant-profile/language-tests/{id}` | `LanguageTestInput`, `If-Match` | Language test | `200`; `404`; `412`; `422` | Own record |
| APP-08 | `DELETE /applicant-profile/language-tests/{id}` | `If-Match` | Empty | `204`; `404`; `409`; `412` | Own record |
| APP-09 | `PUT /applicant-profile/preferences` | Destination/field/level/intake/budget preferences | Preferences + recommendations refresh state | `200`; `422` | Own profile |

## 13. Final Favorites and Comparisons API

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| FAV-01 | `GET /users/me/favorites` | Type/page | Page of saved programs/universities | `200`, `422` | Own records |
| FAV-02 | `PUT /users/me/favorites/{entityType}/{entityId}` | None | Favorite | `200/201`; `404`; `422` | Own records; idempotent |
| FAV-03 | `DELETE /users/me/favorites/{entityType}/{entityId}` | None | Empty | `204` | Own records; idempotent |
| CMP-01 | `GET /users/me/comparisons` | None | Saved comparison sets | `200` | Own records |
| CMP-02 | `POST /users/me/comparisons` | Name and 2–4 same-type entity IDs | Comparison set | `201`; `404`; `422` | Own records; limits enforced |
| CMP-03 | `DELETE /users/me/comparisons/{id}` | None | Empty | `204`, `404` | Own record |

## 14. Final Applications and Documents API

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| APL-01 | `GET /applications` | Status/page/limit | Page of own `ApplicationSummary` | `200`, `401`, `422` | User sees own; staff uses separate Admin scope |
| APL-02 | `POST /applications` | `ApplicationCreate`, `Idempotency-Key` | `ApplicationDetail` | `201`; replay `200`; `409 ACTIVE_APPLICATION_EXISTS`; `422` | User; published/open program intake |
| APL-03 | `GET /applications/{id}` | UUID | `ApplicationDetail` | `200`; `403`; `404` | Owner or `application.manage` |
| APL-04 | `PATCH /applications/{id}` | `ApplicationPatch`, `If-Match` | `ApplicationDetail` | `200`; `400 INVALID_STATE_TRANSITION`; `403`; `412`; `422` | Owner while editable or authorized staff |
| APL-05 | `POST /applications/{id}/submit` | `ApplicationSubmit`, `If-Match` | Submitted detail | `200`; `409 REQUIREMENTS_INCOMPLETE`; `412`; `422` | Owner; declarations/version required |
| APL-06 | `POST /applications/{id}/withdraw` | Reason, `If-Match` | Withdrawn detail | `200`; `400`; `403`; `412`; `422` | Owner where policy permits or staff |
| APL-07 | `GET /applications/{id}/history` | Page/limit | Immutable state history | `200`; `403`; `404` | Owner or application staff |
| APL-08 | `GET /applications/{id}/requirements` | None | Requirement checklist | `200`; `403`; `404` | Owner or application staff |
| DOC-01 | `POST /documents/upload-intents` | File metadata, document type, optional application ID | Presigned URL/token | `201`; `403`; `413`; `415`; `422` | User for own context; staff by permission |
| DOC-02 | `POST /documents/{id}/confirm` | Checksum/upload token | Document in `PROCESSING` | `202`; `400`; `409`; `422` | Upload owner |
| DOC-03 | `GET /documents/{id}` | UUID | Metadata and authorized short-lived download URL | `200`; `403`; `404`; `409 DOCUMENT_NOT_READY` | Owner or application staff |
| DOC-04 | `DELETE /documents/{id}` | `If-Match` | Empty or archived metadata | `204`; `403`; `409 RESOURCE_IN_USE`; `412` | Owner before immutable use; staff policy otherwise |

## 15. Final Courses and Learning API

| ID | Method and endpoint | Auth | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|---|
| CRS-01 | `GET /courses` | Guest | `locale,q,category,level,sort,page,limit` | Page of published `CourseSummary` | `200`, `422` | Public catalog |
| CRS-02 | `GET /courses/{slug}` | Guest | Slug, locale | `CourseDetail`: header, description, instructors, curriculum, duration, price, reviews summary, FAQ, related courses | `200`, `404` | Published course; protected lessons excluded |
| CRS-03 | `GET /courses/{courseId}/lessons/{lessonId}` | User | None | Lesson metadata and signed content access | `200`; `401`; `403 ENROLLMENT_REQUIRED`; `404` | Active enrollment or preview lesson |
| ENR-01 | `GET /enrollments` | User | Page/status | Page of own enrollments | `200`, `422` | Own records |
| ENR-02 | `GET /enrollments/{id}` | User | UUID | Enrollment and course progress | `200`; `403`; `404` | Owner or learning staff |
| ENR-03 | `PATCH /enrollments/{id}/lessons/{lessonId}/progress` | User | `CourseProgressPatch`, `If-Match` | Updated progress | `200`; `403`; `404`; `412`; `422` | Active enrollment owner |

## 16. Final Orders and Payments API

| ID | Method and endpoint | Auth | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|---|
| ORD-01 | `GET /orders` | User | Status/page/limit | Page of own `OrderSummary` | `200`, `422` | Own orders |
| ORD-02 | `POST /orders` | User | `OrderCreate`, required `Idempotency-Key` | Server-priced `OrderDetail` | `201`; replay `200`; `409`; `422` | User; client totals ignored/rejected |
| ORD-03 | `GET /orders/{id}` | User | UUID | `OrderDetail` | `200`; `403`; `404` | Owner or `commerce.manage` |
| ORD-04 | `POST /orders/{id}/cancel` | User | Optional reason, `If-Match` | Cancelled order | `200`; `400 ORDER_NOT_CANCELLABLE`; `403`; `412` | Owner within policy or commerce staff |
| PAY-01 | `POST /orders/{id}/payment-intents` | User | Provider, return URL, `Idempotency-Key` | Redirect/client token and payment ID | `201/200`; `400 ORDER_NOT_PAYABLE`; `403`; `409`; `422`; `502` | Order owner; exact server total |
| PAY-02 | `GET /payments/{id}` | User | UUID | Sanitized payment status | `200`; `403`; `404` | Order owner or commerce staff |
| PAY-03 | `POST /webhooks/payments/{provider}` | External | Raw provider payload + signature headers | Acknowledgement | `200/202`; `400`; `401 SIGNATURE_INVALID`; `409 REPLAY_DETECTED` | Valid provider signature; idempotent event processing |

## 17. Final Tickets and Notifications API

| ID | Method and endpoint | Request | Response | Status / errors | Permission |
|---|---|---|---|---|---|
| TKT-01 | `GET /tickets` | Status/page | Page of own tickets | `200`, `422` | User owns; support has Admin endpoint/scope |
| TKT-02 | `POST /tickets` | Subject, category, plain-text message, optional context | Ticket detail | `201`, `422`, `429` | Authenticated User |
| TKT-03 | `GET /tickets/{id}` | UUID | Ticket and messages | `200`; `403`; `404` | Participant or support |
| TKT-04 | `POST /tickets/{id}/messages` | Plain text 1–5,000 and allowed attachments | Message | `201`; `403`; `404`; `409 TICKET_CLOSED`; `422` | Participant or support |
| NTF-01 | `GET /notifications` | Read state/page | Page of own notifications | `200`, `422` | Own notifications |
| NTF-02 | `POST /notifications/{id}/read` | None | Updated notification | `200`; `404` | Own notification; idempotent |
| NTF-03 | `PUT /notification-preferences` | Channel/topic preferences | Updated preferences | `200`, `422` | Own preferences; mandatory transactional categories cannot be disabled |

## 18. Caching and Conditional Requests

- Public list/detail responses may return `ETag` and appropriate `Cache-Control` keyed by locale,
  entity version and query state.
- Authenticated responses default to `Cache-Control: private, no-store`.
- Admin detail responses return an ETag used by `If-Match` on mutation.
- A safe `GET` with matching `If-None-Match` may return `304` with no body.

## 19. Rate-Limit Baseline

| Operation | Initial policy |
|---|---|
| Public reads | 120 requests/minute/IP with burst allowance |
| Consultation submit | 5/hour/IP and 3/day/normalized mobile, with abuse exceptions handled operationally |
| Login | 10/15 minutes/IP and 5/15 minutes/account identifier |
| Password reset / OTP | 3/hour/identifier and 10/hour/IP |
| Upload intent | 30/hour/user |
| Export | 5/hour/staff user |

Limits are configurable and return `429` plus `Retry-After`. They are security controls, not product
quotas, and must be tuned using observed traffic.

## 20. Contract Acceptance

1. OpenAPI 3.1 validates in CI and exposes no undocumented production route.
2. Request/response Pydantic schemas are generated or checked against the OpenAPI contract.
3. Contract tests cover one success and every declared error class for each implemented endpoint.
4. RBAC tests prove both allowed and denied paths, including assigned-only lead access.
5. Unknown request fields, invalid enums and invalid IDs are rejected consistently.
6. Logs and errors contain request IDs but no secrets or unnecessary personal data.
7. Breaking changes require `/api/v2` or a documented compatibility/deprecation plan.
8. Final-phase endpoints must not be exposed as working APIs until their product phase is enabled.
