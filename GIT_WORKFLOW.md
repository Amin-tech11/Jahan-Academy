# Jahan Academy — Git Workflow

## 1. Branch Model

```text
main                         Production-ready history
└── develop                  Integration branch for the next release
    ├── feature/auth
    ├── feature/courses
    ├── feature/blog
    ├── feature/payments
    └── feature/applications
```

`main` and `develop` are protected, long-lived branches. Work is performed in short-lived branches
and merged through pull requests.

| Branch | Starts from | Pull request target | Purpose |
|---|---|---|---|
| `feature/<slug>` | `develop` | `develop` | Product feature |
| `fix/<slug>` | `develop` | `develop` | Non-production bug fix |
| `docs/<slug>` | `develop` | `develop` | Documentation-only change |
| `chore/<slug>` | `develop` | `develop` | Tooling, CI, dependencies, maintenance |
| `release/<version>` | `develop` | `main` | Stabilize an approved release |
| `hotfix/<slug>` | `main` | `main`, then `develop` | Urgent production correction |

The initial repository foundation uses `feature/project-foundation` because it introduces project
code, specifications, migrations, CI, and engineering policy into the existing repository.

## 2. Required Flow

```text
Create branch
    ↓
Implement the scoped change
    ↓
Format, lint, type-check, test, and migrate where relevant
    ↓
Commit with a meaningful Conventional Commit message
    ↓
Push the feature branch
    ↓
Open a Pull Request to develop
    ↓
CI and Code Review
    ↓
Squash merge and delete the feature branch
```

Commands for a normal feature:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/short-description

# Implement and verify
git add --all
git commit -m "feat(scope): concise outcome"
git push -u origin feature/short-description
```

## 3. Commit Convention

Use Conventional Commit prefixes:

- `feat`: user-visible capability
- `fix`: defect correction
- `docs`: documentation only
- `test`: test-only change
- `refactor`: behavior-preserving code change
- `perf`: measured performance improvement
- `build`: build system or dependency change
- `ci`: automation and workflow change
- `chore`: maintenance not covered above

Examples:

```text
feat(auth): add rotating refresh-token sessions
fix(leads): enforce consultant assignment scope
docs(api): define application submission contract
```

Keep commits focused. Do not commit generated caches, `.env`, credentials, access tokens, database
dumps, or personal production data.

## 4. Pull Request Rules

Every pull request must:

1. Target `develop`, except release/hotfix pull requests.
2. Explain the outcome, scope, tests, migration impact, and security impact.
3. Link relevant requirement IDs or design documents.
4. Pass Lint, Unit Tests, Integration Tests, Build, and Security Checks.
5. Have no unresolved review conversation.
6. Receive at least one approval when another reviewer is available.
7. Update contracts and documentation before changing externally visible behavior.

Feature PRs use squash merge. Release and hotfix PRs may use a merge commit to preserve the release
boundary. Delete merged short-lived branches.

## 5. Main and Release Rules

- Direct pushes to `main` and `develop` are prohibited after repository rulesets are enabled.
- `main` always represents a deployable state.
- A release branch is created only after the scope is frozen.
- After a release/hotfix reaches `main`, merge or cherry-pick the resulting commit back to `develop`.
- Production tags use semantic versions such as `v1.0.0` and are created from `main`.
- Database migrations already released to production are immutable; corrections use a new revision.

## 6. Recommended GitHub Rulesets

Configure rulesets for both `main` and `develop`:

- Require a pull request before merging.
- Require one approval; dismiss stale approvals after new commits.
- Require resolution of all conversations.
- Require status checks: `Lint`, `Unit Tests`, `Integration Tests`, `Build`, and `Security Checks`.
- Require branches to be up to date before merge.
- Block force pushes and branch deletion.
- Restrict bypass to the repository owner for recovery only.

For `main`, additionally require linear/signed history if the team's signing setup is ready and
allow merges only from release/hotfix pull requests by process policy.

## 7. Review Checklist

- Behavior matches `PROJECT_CONTEXT.md`, SRS, and API contracts.
- Authorization is enforced server-side with deny-by-default behavior.
- Personal data and secrets are not logged or exposed.
- Migrations are reversible and tested on PostgreSQL 18.
- Error, empty, loading, mobile, accessibility, localization, and RTL states are considered where
  applicable.
- Tests cover successful, denied, invalid, duplicate, and retry paths proportional to risk.
