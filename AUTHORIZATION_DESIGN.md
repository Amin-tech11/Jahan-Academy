# Jahan Academy — Authorization Design

## 1. Decision Status

The authorization mechanism is implemented, but the final **Role → Permission → Resource scope**
matrix is intentionally not frozen yet. Product approval is required before operational permissions
are assigned to roles.

The previously approved MVP behaviors for Super Admin, Content Editor, Support, and Consultant
remain minimum product constraints. Their exact permission codes, field-level access, transition
rules, and future interaction with Instructor, Sales, Admin, Student, and Customer are still pending
the final matrix.

Examples such as Student viewing purchased courses, Consultant viewing assigned Applications, Admin
managing users, or Super Admin managing the system describe intended policy discussions; they are
not all active grants until recorded in the approved matrix in this document.

## 2. Model

Jahan Academy uses three cooperating controls:

1. **RBAC:** roles receive stable permission codes; users receive one or more roles.
2. **Scoped grants:** a role assignment can be global or limited to a resource scope such as an
   organization, country, university, course, or team.
3. **Domain resource policy:** ownership, assignment, lifecycle state, and relationship rules are
   checked by the module that owns the resource.

```text
Authenticated User
       │
       ▼
Active Role Assignments
       │
       ├── Global grant ──────────────┐
       └── Scoped grant ──────────────┤
                                      ▼
                             Effective permissions
                                      │
                                      ▼
                        Domain resource policy check
                     (owner / assignee / state / scope)
                                      │
                          Allow or deny by default
```

Authentication proves identity. Authorization is evaluated server-side for every protected action.
JWTs do not contain authoritative permissions, so a role change applies without waiting for the
access token to expire.

## 3. Current Actor Interpretation

| Actor label | Current interpretation | Authorization record |
|---|---|---|
| Visitor | Unauthenticated public actor | No database role |
| User | Authenticated public account | System role `user` |
| Student | User with education/learning state | Not a separate role unless later approved |
| Customer | User with an order/customer relationship | Not a separate role unless later approved |
| Applicant | User with applicant/application state | Not a separate role unless later approved |
| Consultant | Staff capability, normally resource-assigned | Candidate staff role; exact grants pending |
| Instructor | Course relationship/capability | Candidate scoped role; pending learning policy |
| Support | Operational staff capability | Candidate staff role; exact grants pending |
| Sales | Commercial staff capability | Candidate staff role; exact grants pending |
| Admin | Broad administration capability | Candidate staff role; boundary vs Super Admin pending |
| Super Admin | Emergency/system administration | Existing system role; detailed grants and safeguards pending |

This preserves the earlier decision that Student, Applicant, and General User share one public
authorization role and differ through profile and resource relationships.

## 4. Data Model

Existing tables support the framework:

- `roles`: stable language-neutral role codes.
- `permissions`: stable action/capability codes.
- `role_permissions`: role-to-permission mapping.
- `user_roles`: user-to-role assignment, optional `scope_type/scope_id`, assigner, assignment time,
  and revocation time.
- `audit_logs`: immutable authorization-administration evidence when management APIs are delivered.

No permission is granted merely because a role name sounds privileged. Role permissions must be
explicit rows, except for public operations that require no authenticated permission.

## 5. Permission Naming

Permission codes use lowercase domain/action notation and are not translated:

```text
catalog.read
catalog.write
lead.read.all
lead.read.assigned
application.read.assigned
course.progress.own
identity.manage
system.manage
```

Permission strings are contracts. Renaming or changing their meaning requires a data migration,
authorization test updates, and an audit of every endpoint that consumes the code.

## 6. Evaluation Rules

1. Default decision is deny.
2. The caller must have a valid, active authentication session.
3. Revoked role assignments are ignored.
4. A global grant applies to all matching resources.
5. A scoped grant applies only when both `scope_type` and `scope_id` match.
6. `ALL` requirements need every permission; `ANY` requirements need at least one.
7. Role names are not checked inside business modules; modules request permissions.
8. Ownership or assignment never grants unrelated administrative actions.
9. List queries apply authorization in the database query, not by filtering a complete result in
   application memory.
10. For direct-object requests, inaccessible records normally return `404` where existence is
    sensitive; otherwise an authenticated but disallowed action returns `403 PERMISSION_DENIED`.
11. Permission/role changes invalidate authorization caches immediately or within an explicitly
    approved short TTL.
12. Mutating authorization data is audit logged and protected against removal of the last recovery
    administrator once the management workflow is implemented.

## 7. Code Contract

The executable framework is in
`backend/app/modules/identity/authorization.py`:

- `AuthorizationContext` contains current active grants.
- `RoleGrant` evaluates global or matching resource scopes.
- `AuthorizationService.require` evaluates `ALL` or `ANY` permission requirements.
- `ResourcePolicy` is implemented in the owning domain for owner/assignee/state decisions.
- `require_permissions(...)` is the FastAPI dependency factory.

Example usage after a permission is approved:

```python
@router.get(
    "/admin/example",
    dependencies=[Depends(require_permissions("example.read"))],
)
async def list_example() -> object:
    ...
```

Resource checks such as “Consultant can view only assigned Applications” belong in the Applications
module policy and repository query. They must not be inferred from the `consultant` role name.

## 8. Draft Matrix Template

The following table remains deliberately unapproved until the Product Owner defines it.

| Role | Permission | Scope | Resource condition | Phase | Status |
|---|---|---|---|---|---|
| Super Admin | `lead.read.all`, `lead.write.all`, `lead.assign`, `lead.sync.retry` | Global | All consultation leads, assignments, and failed Noura retries | MVP | Implemented |
| Support | `lead.read.all`, `lead.write.all`, `lead.assign`, `lead.sync.retry` | Global | All consultation leads, assignments, and failed Noura retries | MVP | Implemented |
| Consultant | `lead.read.assigned`, `lead.write.assigned` | Global | SQL read scope and status mutations require `assigned_consultant_id = actor.user_id` | MVP | Implemented |
| TBD | TBD | Global or scoped | Owner/assignee/state rule | MVP/Final | Pending |

Each approved row must answer:

- Can the actor list resources, view one resource, create, update, delete/archive, assign, approve,
  publish, export, or manage permissions?
- Is access global, own-only, assigned-only, team-scoped, country-scoped, or entity-scoped?
- Which resource states are editable?
- Which fields are visible or editable?
- Does the action require step-up authentication or MFA?
- Must the action create an audit event?

## 9. Acceptance Criteria

- Unauthenticated access to protected endpoints returns `401`.
- Authenticated access without a required grant returns `403` or privacy-preserving `404`.
- Revoked assignments stop granting access.
- Scope mismatch is denied.
- `ALL` and `ANY` semantics are covered by tests.
- Ownership/assignment policies have allowed and denied direct-object tests.
- Every final matrix row maps to at least one automated authorization test.
- No frontend-only condition is treated as security enforcement.
