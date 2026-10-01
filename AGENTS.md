# Jahan Academy panel workflow

This repository uses the fixed chat, panel, branch, and port mapping in `PANEL_WORKFLOW.md`. User instructions take precedence over older branch conventions in `GIT_WORKFLOW.md`.

## Scope and branch

- Each panel chat owns only its matching panel branch. For this chat: `universities-page:3400` → `universities-page` → `http://localhost:3400`.
- At the start of every task, check the current branch, chat/panel name, and assigned port. Stop and report a mismatch before editing.
- Keep ordinary panel changes on the existing panel branch. Do not create or switch branches for them. Commit only on the matching branch.
- University hero images must remain absent until the user explicitly requests placement. Generate requested images as standalone review assets, without adding them to the hero.
- Change shared code only when genuinely required by the panel. Identify any cross-panel dependency and affected files to the user before changing them; proceed only after explicit instruction. Do not make broad authentication, schema, or architecture changes without explicit instruction.
- Never merge or rebase a panel branch into `develop` without the user's explicit merge instruction. The user performs feature PR merges.

## Feature cycle

Requirement → Data/API/Permission Design → Implementation → Unit Tests → Integration Tests → Security & Code Review → Commit → Push & Pull Request → CI Verification. Stop after CI verification.

- Record when a design or test stage does not apply and why. Resolve relevant test and CI failures before starting the next feature.
- For frontend changes, verify the page after a refresh on the panel's assigned localhost port.
- At the end, report branch, port, changed files, tests, commit hash, and remaining issues. Check that the working tree is clean.

## Develop integration

`develop` is the full-site integration branch and uses port 5000 from its own checkout. Only when the user explicitly says to merge a branch into `develop`, inspect Git status and branch identity, compare with `develop`, run relevant tests, report conflicts or regression risks, obtain the user's instruction to proceed, then merge, verify `http://localhost:5000`, and report the result.
