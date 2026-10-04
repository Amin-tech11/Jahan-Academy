# Jahan Academy panel workflow

This repository uses the fixed chat, panel, branch, and port mapping in `PANEL_WORKFLOW.md`. User instructions take precedence over older branch conventions in `GIT_WORKFLOW.md`.

## Reference chat

- The reference chat is `Develop:5000`, chat ID `01a100e5-1085-7373-a431-f45b9b201125`, designated by the user on 2026-10-03.
- This chat may inspect and work on every repository branch and may edit and commit changes for any panel, including shared code required by the task. It is not limited to the `develop` branch or one panel.
- The reference chat's default checkout is `F:/Jahan Academy/.worktrees/develop`, on `develop`, with the integrated preview at `http://localhost:5000`.
- For this reference chat, the authority above overrides panel-only ownership, branch-switching restrictions, and additional approval requirements based solely on crossing panel boundaries. Identify affected panels and shared files before changing them; no separate cross-panel permission is needed within the user's requested task.
- Before working on another branch, verify its identity and working-tree status and use its existing dedicated checkout where available. Keep panel previews on their assigned ports. An intentional branch choice by the reference chat is not a panel mismatch.
- Other panel chats retain their own branch and port restrictions. The existing explicit merge/rebase authorization requirement and feature PR merge ownership still apply; reference-chat status alone is not an instruction to merge branches.

## Scope and branch

- Except for the reference chat defined above, each panel chat owns only its matching panel branch and port in `PANEL_WORKFLOW.md`.
- At the start of every task, check the current branch, chat/panel name, and assigned port. Stop and report a mismatch before editing.
- Keep ordinary panel changes on the existing panel branch. Do not create or switch branches for them. Commit only on the matching branch.
- The user approved `frontend/public/universities/hero/classical-campus.png` as the university listing hero, with the centered `JAHAN ACADEMY` wordmark matching the consultation hero. Do not replace it or add other hero images without an explicit user request. Generate other requested images as standalone review assets.
- Change shared code only when genuinely required by the panel. Identify any cross-panel dependency and affected files to the user before changing them; proceed only after explicit instruction. Do not make broad authentication, schema, or architecture changes without explicit instruction.
- Never merge or rebase a panel branch into `develop` without the user's explicit merge instruction. The user performs feature PR merges.

## Feature cycle

Requirement → Data/API/Permission Design → Implementation → Unit Tests → Integration Tests → Security & Code Review → Commit → Push & Pull Request → CI Verification. Stop after CI verification.

- Record when a design or test stage does not apply and why. Resolve relevant test and CI failures before starting the next feature.
- For frontend changes, verify the page after a refresh on the panel's assigned localhost port.
- At the end, report branch, port, changed files, tests, commit hash, and remaining issues. Check that the working tree is clean.

## Develop integration

`develop` is the full-site integration branch and uses port 5000 from its own checkout. Only when the user explicitly says to merge a branch into `develop`, inspect Git status and branch identity, compare with `develop`, run relevant tests, report conflicts or regression risks, obtain the user's instruction to proceed, then merge, verify `http://localhost:5000`, and report the result.
