# CI execution and former local runner

## Current configuration (2026-10-06)

GitHub Actions now runs every CI/CD job on GitHub-hosted `ubuntu-24.04`
runners. The repository is public. Python and pnpm dependency caches are
restored through GitHub Actions because each job starts on a fresh VM.
Pull requests from forks can run the read-only validation jobs; publishing
remains limited to trusted pushes and deployment retains its existing gates.

The former `jahan-local-wsl` systemd service is stopped and disabled. It is
retained only for historical reference; do not restart it for GitHub Actions.
The optional local test scripts below remain available for manual development,
but GitHub CI does not call them or depend on WSL, this PC, or localhost:5000.

All existing repository branches were checked during this migration. Only
`develop` still selected the local runner; the other branches already selected
GitHub-hosted Ubuntu runners.

No application, database schema, permission, or panel UI changes are involved.
Verification is workflow linting and the actual GitHub CI run, rather than
repeating the full test suite on the workstation.

## Historical local configuration

The former workflow targeted `[self-hosted, linux, x64, jahan-local]`. GitHub service
containers and the existing Bash/Docker steps require Linux, so use the existing
Ubuntu-24.04 WSL distribution rather than the Windows runner ZIP.

Installation and persistent Docker access were explicitly approved on 2026-10-04.
The runner is registered as `jahan-local-wsl` and runs as a systemd service.

## Installed environment

- Official GitHub Actions runner 2.337.0, Linux x64.
- Docker Engine 29.1.3, Compose 2.40.3 and Buildx 0.30.1 are available in Ubuntu.
- Archive SHA-256:
  `70920811a4f8ad4328818682bca5c6469c1c942fab52448868071d0063816613`.
- Dedicated Linux account: `jahan-ci`, with home `/home/jahan-ci`, no sudo grant.
- Runner directory: `/opt/actions-runner-jahan`; work directory: its `_work`.
- Add `jahan-ci` to the existing `docker` group. This grants administrative
  control of the shared Docker daemon, including its containers and mounted data.
  It is not an isolation boundary from other Docker projects on the computer.
- Install runner runtime dependencies using GitHub's `bin/installdependencies.sh`.
- Register only to `https://github.com/Amin-tech11/Jahan-Academy`, with name
  `jahan-local-wsl` and custom label `jahan-local`, using a fresh registration
  token. Never commit a token or runner credentials.
- Install and start the official systemd service as `jahan-ci`. It starts when
  this WSL distribution starts. This Ubuntu distribution has its own Docker
  Engine service; Docker Desktop is not required for this runner. Windows login
  auto-start is not configured by this change.

Verify the runner is online through GitHub before submitting work. A workflow rerun uses the
old workflow from its original commit; test the new commit instead.

## Local resource ownership

- Each CI run has a unique Compose project and backend/frontend image tags.
- Integration databases and Redis use dynamically allocated ports; connection
  URLs come from `job.services` rather than the workstation's 5432/6379.
- `docker-compose.ci.yml` binds stack HTTP and S3 to random loopback ports.
- Smoke-test containers have per-run names and a random loopback port.
- Cleanup removes only that run's containers, volumes and image tags. No global
  `docker system prune`, shared project shutdown or database reset is used.
- Checkout does not persist Git credentials; registry login is removed after
  publishing. Fork PRs do not run on this workstation.
- uv, managed Python and Trivy's vulnerability database are downloaded from their
  official GitHub distributions, avoiding mirrors unavailable on this network.
  Trivy caches its database in the dedicated `jahan-ci-trivy-cache` Docker volume.
- uv and pnpm reuse their existing persistent local caches. GitHub cache archive
  restore/upload is disabled on this workstation to avoid redundant downloads,
  extraction and disk I/O on each job. Locked installs and every CI gate remain.

Existing publish/deploy conditions remain in force. This only changes their
runner routing; it does not enable deployment or change deployment secrets.
Older branches retain their hosted-runner workflow until this change reaches
them through the normal branch/PR process.

## Operations after installation

Inside Ubuntu, from `/opt/actions-runner-jahan`:

```sh
sudo ./svc.sh status
sudo ./svc.sh stop
sudo ./svc.sh start
```

From Windows PowerShell, start Ubuntu and keep it running in the background:

```powershell
Start-Process wsl.exe -ArgumentList '-d Ubuntu-24.04 --exec /bin/sleep infinity' -WindowStyle Hidden
```

Keep the computer awake and Ubuntu running while jobs run. Shutdown or sleep
interrupts jobs. Disk usage should be monitored because
tool caches and Docker build cache persist; clear only identified CI-owned data.

## Run backend checks from Windows

Use the installed Linux toolchain rather than the Windows Store `python` alias:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-backend-local.ps1 -Lint -Integration -BuildBackend
```

The execution-policy override applies only to that PowerShell process. Without
flags, the script runs unit, architecture and contract tests. `-Integration`
creates disposable PostgreSQL 18 and Redis 8 containers with random loopback
ports, applies migrations, tests rollback/re-upgrade, and removes only its own
containers. `-BuildBackend` builds the production image and checks its live
health endpoint as the unprivileged application user.
For builds, the script stages only the Dockerfile's production inputs on Linux
storage. Windows/DrvFS cache folders are not traversed, avoiding extended-attribute
permission errors and excessive context transfer. The staging directory is removed
after the run.
The production-image probe allows 180 startup attempts, with bounded connection
and response timeouts. This accommodates first imports under workstation disk
load; a failure still fails the gate and prints container logs.

Local, CI integration and CI Compose PostgreSQL data use a disposable 512 MiB tmpfs
mount, avoiding slow initdb/fsync on the virtual disk. This affects test services
only; development and production PostgreSQL storage and durability are unchanged.
The CI Compose override replaces the legacy `/var/lib/postgresql/data` volume
mount with the PostgreSQL 18 parent directory `/var/lib/postgresql`.
GitHub integration services allow a 120-second health-check start period followed
by 30 checks at five-second intervals. A cold PostgreSQL start on this workstation
previously reached readiness after the old 40-second failure budget had expired.
The same startup budget applies to Redis; unhealthy services still fail the job.
The CI Compose override also grants a three-minute start period and 30 health
checks at ten-second intervals to the application and storage services. The
original readiness commands remain in effect. This prevents cold Python imports
from exhausting the mock integration API's former one-minute startup budget.

The wrapper runs as `jahan-ci` without starting an interactive systemd user
session. Each checkout gets a separate locked environment and test/tool caches
under `/home/jahan-ci/local-tests`, outside GitHub's active workspace. Ubuntu's
disk is stored at `F:\DevData\WSL\Ubuntu-24.04`; these operations do not create
Python environments or caches on C. An installed uv runner tool cache is required.

The Windows wrapper checks host/guest clock skew before running. JWT session
tests require a stable clock. On this Ubuntu 24.04 workstation,
`systemd-timesyncd.service` is disabled so that it cannot compete with Hyper-V's
implicit Windows time synchronization. This follows Ubuntu's WSL guidance:
https://ubuntu.com/wsl/docs/stable/explanation/time-sync/
If the wrapper reports clock skew after suspension, synchronize WSL with the
Windows host before issuing tokens; do not relax JWT validation to hide the issue.

The backend image assigns source ownership with `COPY --chown` and changes only
the `/app` directory owner after dependency installation. Avoid recursive
ownership changes over `.venv`: OverlayFS can copy files from previous layers
when metadata changes, causing substantial disk I/O during Build.

GitHub reference: https://docs.github.com/en/actions/reference/runners/self-hosted-runners
