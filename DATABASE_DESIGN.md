# Jahan Academy — Database Design

**Status:** Entity catalog approved; executable baseline implemented; formal ERD/data dictionary alignment pending
**Target:** Complete product architecture, implemented progressively
**Database:** PostgreSQL 18
**Backend:** FastAPI / SQLAlchemy 2 / Alembic on Python 3.12

## 1. Design Process

Database design is intentionally performed in three gated stages:

1. **Entity Catalog:** identify entities, ownership, boundaries, and duplicates.
2. **ERD:** approve relationships, cardinality, optionality, and aggregate boundaries.
3. **Physical Data Dictionary:** define every table and column, including type, PK, FK, nullability, default, index, constraint, retention, and sensitivity.

This document completes Stage 1. The Product Owner subsequently authorized an executable migration baseline before the formal ERD/data-dictionary pass. The baseline is recorded in `DATABASE_IMPLEMENTATION.md`; Stage 2 and Stage 3 must now document and validate that implementation before production schema freeze.

## 2. Global Modeling Decisions

### 2.1 Identity Decisions

- `User` is the single human identity for applicants, students, instructors, consultants, support staff, editors, and administrators.
- Student, Applicant, and General User are profile/workflow states, not separate authorization roles.
- `Customer` is **not** a separate entity. A User becomes a customer by owning an Order, Payment, paid Booking, or Enrolment.
- `AdminUser` is **not** a separate identity table in the final model. Staff permissions are represented through `UserRole` and object-level authorization.
- `Instructor` is a specialized profile attached one-to-one to User, not an independent login identity.
- A consultation `Lead` may exist without a User account and may later be linked to exactly one User after verified matching or an approved merge.

### 2.2 Content and Localization Decisions

- Business entities use stable shared English-readable slugs where public URLs require them.
- Bilingual content uses separate translation entities with a unique `(parent_id, locale)` constraint.
- Machine-readable states/codes remain English; translations are presentation data.
- Media metadata is centralized in `MediaAsset`; domain entities reference or assign assets rather than duplicating file metadata.
- SEO fields belong to the localized public representation, not the base entity.

### 2.3 Commerce Decisions

- `Product` is the sellable abstraction. Courses, consultation packages, services, or other offerings may reference a Product.
- Order and payment are separate: an Order describes what the User bought; Payment records gateway attempts and confirmations.
- Browser payment return does not create financial truth; verified gateway events do.
- Financial history is append-oriented. Confirmed financial records are reversed/refunded, not edited destructively.

### 2.4 Workflow Decisions

- Lead, Application, Document, Booking, Ticket, Payment, and Enrolment state changes have explicit history/event entities.
- Operational assignments are historical entities, not only a mutable `assigned_to` field.
- Provider payloads and flexible metadata use JSONB only when their shape is externally controlled or genuinely variable; core business fields remain relational.
- AuditLog is not a substitute for domain history. Domain history explains workflow; AuditLog explains privileged data-changing actions.

## 3. Entity Catalog

### 3.1 Identity, Access, Consent, and Privacy

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `User` | Unified human account and lifecycle state | Has Profile, Identities, Roles, Sessions; owns Applications, Orders, Tickets, Enrolments | Approved |
| `UserIdentity` | Login identity such as mobile OTP, email/password, Google | Belongs to User; unique provider + provider subject | Approved |
| `UserProfile` | Basic personal, residence, nationality, locale, and onboarding data | One-to-one User | Approved |
| `Role` | Stable authorization role | Many-to-many User and Permission | Approved |
| `Permission` | Atomic server authorization capability | Many-to-many Role | Approved |
| `UserRole` | User-to-role assignment with scope and lifecycle | Belongs to User and Role; assigned by User | Approved |
| `RolePermission` | Role-to-permission mapping | Belongs to Role and Permission | Approved |
| `Session` | Durable browser session/revocation/audit facts | Belongs to User and optional Device | Approved |
| `AuthChallenge` | OTP, email verification, step-up, or login challenge | Optional User/Identity; short-lived | Approved |
| `PasswordResetToken` | Single-use password recovery token record | Belongs to UserIdentity/User | Approved |
| `UserDevice` | Remembered device and push-notification endpoint metadata | Belongs to User | Approved for final product |
| `ConsentRecord` | Versioned privacy/contact/marketing/terms consent evidence | Belongs to User or Lead | Approved |
| `PrivacyRequest` | Access, correction, deletion, or anonymization request | Belongs to User or references Lead | Approved |
| `AccountMerge` | Audited merge/link decision between duplicate accounts | Source User, target User, approved by staff User | Approved for account phase |

### 3.2 Geography, Universities, and Academic Programs

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `Country` | Country master record, ISO code, lifecycle, ordering | Has translations, cities, universities | Approved |
| `CountryTranslation` | Localized country name/content/SEO | Belongs to Country | Approved |
| `City` | City within a country | Belongs to Country; has translations/universities | Approved |
| `CityTranslation` | Localized city name and optional summary | Belongs to City | Approved |
| `University` | Institution master and non-localized operational fields | Belongs to Country/City; has Programs and translations | Approved |
| `UniversityTranslation` | Localized institution content and SEO | Belongs to University | Approved |
| `UniversityMedia` | Ordered/logo/hero/gallery media assignment | Belongs to University and MediaAsset | Approved |
| `UniversityRanking` | Ranking value with organization, year, and source | Belongs to University | Approved for final product |
| `AcademicLevel` | Bachelor, Master, PhD, foundation, etc. | Has translations and Programs | Approved |
| `AcademicLevelTranslation` | Localized level label/description | Belongs to AcademicLevel | Approved |
| `FieldOfStudy` | Hierarchical academic subject taxonomy | Optional parent; has translations and Programs | Approved |
| `FieldOfStudyTranslation` | Localized field label/description | Belongs to FieldOfStudy | Approved |
| `Program` | University-defined academic program | Belongs to one University, Level, primary Field | Approved |
| `ProgramTranslation` | Localized title, content, requirements text, SEO | Belongs to Program | Approved |
| `ProgramField` | Additional fields/subjects for interdisciplinary Programs | Joins Program and FieldOfStudy | Approved |
| `Intake` | Stable intake term such as spring/fall/unknown | Has ProgramIntakes | Approved |
| `ProgramIntake` | Program availability for a term/year/deadline | Belongs to Program and Intake | Approved |
| `ProgramRequirement` | Structured admission/language/document requirement | Belongs to Program; optional translation/content payload | Approved for application phase |
| `ProgramMedia` | Ordered Program media assignment | Belongs to Program and MediaAsset | Approved |
| `Scholarship` | Scholarship/funding opportunity | Optional University/Program scope; has translations | Approved for final product |
| `ScholarshipTranslation` | Localized scholarship content and SEO | Belongs to Scholarship | Approved |

### 3.3 Content, Marketing, SEO, and Media

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `MediaAsset` | Canonical file/image/video metadata, ownership, source, privacy class | Has variants and domain assignments | Approved |
| `MediaVariant` | Derived image/video rendition metadata | Belongs to MediaAsset | Approved |
| `Page` | Managed static/landing page lifecycle and slug | Has translations and blocks | Approved |
| `PageTranslation` | Localized page title/body/SEO | Belongs to Page | Approved |
| `PageBlock` | Ordered typed content block/configuration | Belongs to Page; may reference MediaAsset | Approved |
| `ArticleCategory` | Hierarchical editorial taxonomy | Has translations and article assignments | Approved |
| `ArticleCategoryTranslation` | Localized category label/SEO | Belongs to ArticleCategory | Approved |
| `Article` | Editorial article/news lifecycle and author | Belongs to author User; has translations/categories | Approved |
| `ArticleTranslation` | Localized title, excerpt, body, and SEO | Belongs to Article | Approved |
| `ArticleCategoryAssignment` | Article-to-category mapping | Joins Article and ArticleCategory | Approved |
| `ArticleTag` | Reusable editorial tag | Has localized label or stable display strategy | Approved for final product |
| `ArticleTagAssignment` | Article-to-tag mapping | Joins Article and ArticleTag | Approved |
| `FAQ` | Reusable FAQ lifecycle | Has translations and assignments | Approved |
| `FAQTranslation` | Localized question/answer | Belongs to FAQ | Approved |
| `FAQAssignment` | Ordered FAQ attachment to page/entity | Belongs to FAQ; polymorphic approved target | Approved |
| `Service` | Jahan Academy service definition | Has translations; may reference Product | Approved |
| `ServiceTranslation` | Localized service content and SEO | Belongs to Service | Approved |
| `NavigationMenu` | Named navigation/footer menu | Has ordered items | Approved |
| `NavigationItem` | Localized navigation item and target | Belongs to NavigationMenu; optional parent | Approved |
| `Redirect` | Managed permanent/temporary URL redirect | Source path to destination path | Approved |
| `SiteSetting` | Versioned low-volume site configuration | Optional locale; changed by staff User | Approved |
| `Campaign` | Marketing campaign/UTM ownership and active period | Has landing pages and lead attribution | Approved for final product |

### 3.4 Leads, Consultation, and CRM Operations

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `Lead` | Consultation/interest record that may predate an account | Optional User, Country, University, Program, Campaign | Approved |
| `LeadService` | Lead-to-requested-service mapping | Joins Lead and Service | Approved |
| `LeadAssignment` | Historical consultant/support assignment | Lead, assignee User, assigned-by User | Approved |
| `LeadStatusHistory` | Append-only lead workflow transitions | Lead, old/new status, actor User | Approved |
| `LeadNote` | Internal operational note | Lead and author User | Approved |
| `LeadActivity` | Calls, email, meetings, and follow-up activity timeline | Lead, actor User, optional Booking | Approved |
| `ConsultationOffering` | Bookable free/paid consultation type | Optional Service/Product; duration and policy | Approved for booking phase |
| `ConsultantAvailability` | Recurring/exception availability rule | Consultant User and time zone | Approved for booking phase |
| `ConsultationBooking` | Appointment lifecycle and selected consultant/offering | User/Lead, consultant, Offering, optional Order | Approved |
| `BookingStatusHistory` | Booking transition timeline | Booking and actor User | Approved |
| `ConsultationSession` | Actual session outcome/report/meeting data | One-to-one or one-to-many Booking | Approved |
| `ConsultationFollowUp` | Due follow-up task after lead/session | Lead/Booking, owner User | Approved |

### 3.5 Applicant Profile and Admissions

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `StudyPreference` | Target level/intake/year/budget and constraints | One active/versioned set per User | Approved |
| `PreferredCountry` | User preference for one country with priority | Joins StudyPreference and Country | Approved |
| `PreferredUniversity` | User preference for one university with priority | Joins StudyPreference and University | Approved |
| `PreferredField` | User preference for one field with priority | Joins StudyPreference and FieldOfStudy | Approved |
| `EducationRecord` | Prior education history and grading scale | Belongs to User | Approved |
| `LanguageTest` | Language exam/plan and component scores | Belongs to User; optional Document | Approved |
| `WorkExperience` | Employment/resume history | Belongs to User | Approved |
| `Skill` | Normalized skill taxonomy | Many-to-many User | Approved |
| `UserSkill` | User-to-skill assignment and proficiency | Joins User and Skill | Approved |
| `ProfileAchievement` | Project, award, volunteering, certificate | Belongs to User; optional Document | Approved |
| `FundingProfile` | Funding sources, budget, scholarship/loan needs | Belongs to User | Approved |
| `Application` | User's application to a Program/ProgramIntake | User, Program, Intake; operational owner | Approved |
| `ApplicationAssignment` | Historical consultant/reviewer ownership | Application, assignee User, assigned-by User | Approved |
| `ApplicationStatusHistory` | Append-only application workflow transitions | Application and actor User | Approved |
| `ApplicationTask` | Applicant/staff task, due date, completion | Application, assignee User | Approved |
| `ApplicationRequirement` | Requirement snapshot for this application | Application, optional source ProgramRequirement | Approved |
| `ApplicationDocument` | Document version satisfying a requirement | ApplicationRequirement and DocumentVersion | Approved |
| `ApplicationNote` | Internal note or applicant-visible note | Application and author User | Approved |
| `ApplicationSubmission` | Submission attempt to institution/provider | Application, submitted-by User, external reference | Approved |
| `ApplicationDecision` | Admission/rejection/waitlist/conditional decision | Application, optional decision Document | Approved |
| `ApplicationEvent` | External/provider and system timeline event | Application; deduplicated external event | Approved |

### 3.6 Documents and Verification

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `Document` | Logical applicant/staff-owned document | Belongs to User; has versions | Approved |
| `DocumentVersion` | Immutable uploaded/generated file version | Document and MediaAsset | Approved |
| `DocumentReview` | Review outcome and feedback for a version | DocumentVersion and reviewer User | Approved |
| `DocumentAccessLog` | Sensitive download/preview/share audit | DocumentVersion and actor User | Approved |
| `DocumentShare` | Explicit time-bounded share authorization | DocumentVersion, recipient/context, creator User | Approved for final product |
| `IdentityVerification` | Government ID/passport verification workflow | User and supporting DocumentVersions | Conditional until policy is approved |

### 3.7 Learning Management System

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `CourseCategory` | Hierarchical learning taxonomy | Has translations/course mappings | Approved |
| `CourseCategoryTranslation` | Localized category label/content | Belongs to CourseCategory | Approved |
| `Course` | Course lifecycle, delivery mode, Product link | Has translations, instructors, curriculum | Approved |
| `CourseTranslation` | Localized title, summary, description, SEO | Belongs to Course | Approved |
| `InstructorProfile` | Teaching profile and public biography | One-to-one User | Approved |
| `CourseInstructor` | Instructor assignment and display order | Joins Course and InstructorProfile | Approved |
| `CourseCategoryAssignment` | Course-to-category mapping | Joins Course and CourseCategory | Approved |
| `CourseSection` | Ordered curriculum section/module | Belongs to Course; has translations | Approved |
| `CourseSectionTranslation` | Localized section title/description | Belongs to CourseSection | Approved |
| `Lesson` | Ordered learning unit and delivery type | Belongs to CourseSection | Approved |
| `LessonTranslation` | Localized lesson title/body | Belongs to Lesson | Approved |
| `LessonAsset` | Lesson media/download/live-session resource | Lesson and MediaAsset/meeting reference | Approved |
| `Enrolment` | User access to a Course and progress state | User, Course, originating OrderItem | Approved |
| `LessonProgress` | Per-enrolment lesson progress/bookmark | Enrolment and Lesson | Approved |
| `LiveClassSession` | Scheduled live class, attendance window, provider meeting | Course/Lesson and instructor User | Approved |
| `Attendance` | User attendance for live class | LiveClassSession and Enrolment | Approved |
| `Quiz` | Course/lesson assessment definition | Course or Lesson; has questions | Approved |
| `QuizQuestion` | Versioned assessment question | Belongs to Quiz | Approved |
| `QuizOption` | Choice/answer option | Belongs to QuizQuestion | Approved |
| `QuizAttempt` | User attempt, score, timing, state | Quiz and Enrolment | Approved |
| `QuizAnswer` | Attempt answer snapshot | QuizAttempt and QuizQuestion | Approved |
| `Assignment` | Graded course assignment definition | Course or Lesson | Approved |
| `AssignmentSubmission` | Learner submission, grade, feedback | Assignment and Enrolment; optional Document | Approved |
| `CourseReview` | Verified learner rating/review and moderation | Course, User, Enrolment | Approved |
| `Certificate` | Issued verifiable completion certificate | Enrolment and generated Document | Approved |

### 3.8 Products, Orders, Payments, and Finance

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `Product` | Sellable abstraction and lifecycle | Referenced by Course/Service/Offering; has prices | Approved |
| `ProductTranslation` | Localized product checkout/invoice labels | Belongs to Product | Approved |
| `ProductPrice` | Currency/market/time-bounded price | Belongs to Product | Approved |
| `Order` | User purchase intent and financial summary | User; has items/payments/invoice | Approved |
| `OrderItem` | Immutable purchased item snapshot | Order, Product, optional target entity | Approved |
| `Payment` | Gateway payment attempt and confirmed amount | Order; has events/refunds | Approved |
| `PaymentEvent` | Deduplicated provider callback/verification event | Payment; identified by provider event ID | Approved |
| `Refund` | Full/partial refund lifecycle | Payment and optional OrderItem | Approved |
| `Invoice` | Numbered financial document/snapshot | Order; generated Document | Approved |
| `Coupon` | Discount rule, limits, validity | Has redemptions and optional product scope | Approved |
| `CouponProduct` | Coupon-to-product eligibility | Joins Coupon and Product | Approved |
| `CouponRedemption` | Audited use of coupon by User/Order | Coupon, User, Order | Approved |
| `InstallmentPlan` | Installment definition for Product/Order | Product or Order; has installments | Approved for final product |
| `Installment` | One scheduled payable installment | InstallmentPlan, Order, optional Payment | Approved for final product |
| `Wallet` | User balance account by currency | Belongs to User; has transactions | Approved only when wallet feature is activated |
| `WalletTransaction` | Append-only wallet ledger entry | Wallet, optional Order/Payment/Refund | Conditional with wallet feature |

### 3.9 Support, Conversations, and Notifications

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `Conversation` | Message thread for application, consultation, course, or support | Has participants/messages; contextual target | Approved |
| `ConversationParticipant` | User membership/read state in conversation | Conversation and User | Approved |
| `Message` | Immutable message with optional attachment/reply | Conversation, sender User, optional MediaAsset | Approved |
| `Ticket` | Support case lifecycle and priority | Requester User, assignee User, Conversation | Approved |
| `TicketStatusHistory` | Append-only ticket transitions | Ticket and actor User | Approved |
| `NotificationTemplate` | Localized channel/event template | Event code, locale, channel | Approved |
| `NotificationPreference` | User opt-in/out and channel preference | User, event category, channel | Approved |
| `Notification` | In-app/user-facing notification | User; optional target entity | Approved |
| `NotificationDelivery` | Email/SMS/push delivery attempt and provider state | Notification or event; template/provider | Approved |

### 3.10 Integrations, Reliability, Audit, and Operations

| Entity | Purpose | Principal relationships | Decision |
|---|---|---|---|
| `IntegrationOutbox` | Durable event written with business transaction | Aggregate type/ID, event type/version | Approved |
| `IntegrationSyncRecord` | Provider-specific synchronization state | Provider, entity type/ID, external ID | Approved |
| `WebhookEvent` | Raw-safe deduplicated incoming provider event | Provider + external event ID | Approved |
| `IdempotencyKey` | Request/job replay protection and stored outcome | Actor/scope/key | Approved |
| `JobFailure` | Operational record for exhausted/dead-letter work | Outbox/job reference and safe error | Approved |
| `AuditLog` | Immutable privileged change/access log | Actor User, action, entity, safe diff | Approved |
| `FeatureFlag` | Controlled feature rollout/configuration | Key, environment/audience rule | Approved |
| `DataRetentionRun` | Evidence of retention/anonymization execution | Policy, counts, operator/job | Approved |
| `ImportJob` | Excel/CSV import lifecycle and validation summary | Initiator User and source MediaAsset | Approved |
| `ImportRowError` | Row-level import validation failure | Belongs to ImportJob | Approved |
| `ExportJob` | Asynchronous export lifecycle and generated file | Initiator User and output MediaAsset | Approved |

## 4. Entities Deliberately Not Created

| Rejected entity | Replacement | Reason |
|---|---|---|
| `Customer` | User + Order/Payment/Enrolment relationships | Customer is a commercial state, not a second identity |
| `Student` | User + UserProfile + Enrolment | Prevents duplicate identity and login models |
| `Applicant` | User + profile entities + Application | Applicant is a workflow state |
| `AdminUser` | User + UserRole | One authentication/authorization authority |
| `Consultant` | User + consultant Role + assignment/availability entities | Role and operational data are separate concerns |
| Standalone `Instructor` login | InstructorProfile attached to User | One person may be both instructor and another role |
| Separate `News` table | Article with article type | News and editorial articles share lifecycle, categories, localization, SEO |
| Separate `CustomerMessage`/`ApplicationMessage` tables | Conversation + Message with context | One secure messaging model with explicit contextual authorization |
| Provider-specific lead tables | IntegrationSyncRecord and provider adapters | Avoids coupling domain storage to Noura or another CRM |
| Separate table per locale | Translation entities | Supports consistent constraints and adding locales without duplicating schema |

## 5. Aggregate Ownership

| Aggregate root | Owned entities | External references allowed |
|---|---|---|
| User | Profile, identities, sessions, devices, consents, preferences | Roles, Applications, Orders, Enrolments |
| University | Translations, media, rankings | Country, City, Programs |
| Program | Translations, fields, intakes, requirements, media | University, Level, Fields |
| Article | Translations, category/tag assignments | Author User, MediaAsset |
| Lead | Services, assignments, histories, notes, activities | User, Campaign, Program, Booking |
| Booking | History, session, follow-ups | Lead/User, Consultant User, Order |
| Application | Assignments, status history, tasks, requirements, notes, submissions, decisions, events | User, ProgramIntake, Documents |
| Document | Versions, reviews, access/share records | Owner User, MediaAsset, ApplicationRequirement |
| Course | Translations, instructors, categories, sections, lessons, assessments | Product, MediaAsset |
| Enrolment | Progress, attempts, submissions, attendance, certificate | User, Course, OrderItem |
| Order | Items, payments, invoice, coupon redemption, installments | User, Products |
| Ticket | Status history and Conversation | Requester/assignee Users |
| Conversation | Participants and Messages | Context entity such as Application/Ticket |

## 6. Conceptual Relationship Skeleton

This is a coverage check before the formal ERD:

```text
User
├── UserProfile
├── UserIdentity[]
├── UserRole[] ── Role ── RolePermission[] ── Permission
├── Session[] / UserDevice[] / ConsentRecord[]
├── StudyPreference
│   ├── PreferredCountry[] ── Country
│   ├── PreferredUniversity[] ── University
│   └── PreferredField[] ── FieldOfStudy
├── EducationRecord[] / LanguageTest[] / WorkExperience[]
├── Application[] ── ProgramIntake ── Program ── University ── Country
│   ├── ApplicationRequirement[] ── ApplicationDocument[] ── DocumentVersion
│   ├── ApplicationTask[]
│   ├── ApplicationStatusHistory[]
│   └── ApplicationSubmission[] / ApplicationDecision
├── Document[] ── DocumentVersion[] ── MediaAsset
├── Order[] ── OrderItem[] ── Product
│   ├── Payment[] ── PaymentEvent[] / Refund[]
│   └── Invoice / InstallmentPlan
├── Enrolment[] ── Course
│   ├── LessonProgress[]
│   ├── QuizAttempt[]
│   ├── AssignmentSubmission[]
│   └── Certificate
├── Ticket[] ── Conversation ── Message[]
└── Notification[] ── NotificationDelivery[]

Lead (account optional)
├── LeadService[] ── Service
├── LeadAssignment[] ── User (Consultant/Support)
├── LeadStatusHistory[] / LeadNote[] / LeadActivity[]
└── ConsultationBooking[] ── ConsultationSession

Content
├── Page ── PageTranslation[] / PageBlock[]
├── Article ── ArticleTranslation[] / Categories[] / Tags[]
├── FAQ ── FAQTranslation[] / FAQAssignment[]
└── Service ── ServiceTranslation[] ── Product?
```

## 7. Entity Review Decisions Needed Before Physical ERD

The following items do not block the entity catalog, but their answers affect the formal ERD and physical tables:

1. Whether IdentityVerification will be part of the first Application release and which provider/manual workflow owns it.
2. Whether Wallet is a committed final-product feature or should remain outside the first commerce schema.
3. Whether paid consultation uses the common Product/Order model from its first release.
4. Whether institutions ever receive their own portal users; no `InstitutionUser` role/scope is currently approved.
5. Whether messaging is limited to User–staff conversations or later includes university/partner participants.
6. Whether course video is fully external-hosted or stored in Jahan Academy object storage/CDN.
7. Iranian accounting/tax invoice requirements and whether an external accounting system becomes authoritative.

Until changed, the recommended assumptions are: manual identity review, wallet disabled, paid consultation uses Product/Order, no institution portal, messaging only among platform Users, signed object/CDN course delivery, and Jahan Academy Order/Payment as the operational commerce record.

## 8. Next Database Design Gate

After the Entity Catalog is accepted, Stage 2 will produce domain ERDs with exact cardinalities and delete behavior for:

1. Identity and access.
2. Geography, universities, Programs, and content.
3. Leads and consultation.
4. Applicants, applications, and documents.
5. LMS.
6. Commerce.
7. Communication, notifications, integrations, and audit.

Stage 3 will then define every physical table using the required matrix:

| Column | Data type | PK | FK | Nullable | Default | Index | Constraint / sensitivity |
|---|---|---:|---|---:|---|---|---|

An initial Alembic baseline has been explicitly authorized and generated. No additional domain-expanding migration should be added until its ERD relationship and physical column matrix are documented, because changing aggregate boundaries after shared deployment creates avoidable destructive churn.
