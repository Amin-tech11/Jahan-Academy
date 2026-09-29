# Jahan Academy working instructions

These instructions apply to every future feature and behavior change in this repository. Follow `GIT_WORKFLOW.md` for commit conventions, review rules, and release policy, subject to the panel-branch exception below.

## One feature at a time

- For work on an existing panel, use that panel's existing branch (for example, `codex/home-page` for home-page changes). Do not create a separate feature branch for each change to that panel. For a new area without an existing panel branch, use a dedicated `feature/<descriptive-slug>` branch.
- Complete these stages in order for each feature: Requirement → Data/API/Permission Design → Implementation → Unit Tests → Integration Tests → Security & Code Review → Commit → Push & Pull Request → CI Verification. Stop after CI verification; the user performs merges.
- Document or confirm the requirement and relevant data, API, and authorization decisions before implementation. Record when a stage does not apply and why.
- Run the relevant unit and integration tests and resolve failures before review or commit. Review security and code quality, including permission boundaries, before committing.
- Push the panel or feature branch and create or update its pull request against the appropriate integration branch. Verify all required CI checks are green and resolve review findings. Do not merge pull requests on the user's behalf.
- Do not begin the next feature until the current feature's required tests and CI checks are green. If an external blocker prevents a stage, report the blocker and leave the feature unfinished.
- For frontend changes, ensure the local development server serves the changed files and verify the result is visible after refreshing localhost. Start or update the local server as needed; report if localhost cannot be verified.
