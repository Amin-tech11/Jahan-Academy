# Jahan Academy working instructions

These instructions apply to every future feature and behavior change in this repository. Follow `GIT_WORKFLOW.md` for the repository's `develop` target, commit convention, review rules, and release policy.

## One feature at a time

- Develop each feature on its own `feature/<descriptive-slug>` branch, created from the current `develop` branch. Keep unrelated changes out of that branch.
- Complete these stages in order for each feature: Requirement → Data/API/Permission Design → Implementation → Unit Tests → Integration Tests → Security & Code Review → Commit → Push & Pull Request → CI Verification → Merge.
- Document or confirm the requirement and relevant data, API, and authorization decisions before implementation. Record when a stage does not apply and why.
- Run the relevant unit and integration tests and resolve failures before review or commit. Review security and code quality, including permission boundaries, before committing.
- Push the branch and open a pull request to `develop`. Verify all required CI checks are green and resolve review findings before merging under repository review rules.
- Do not begin the next feature until the current feature's required tests and CI checks are green and its merge is complete. If an external blocker prevents a stage, report the blocker and leave the feature unfinished.
- For frontend changes, ensure the local development server serves the changed files and verify the result is visible after refreshing localhost. Start or update the local server as needed; report if localhost cannot be verified.
