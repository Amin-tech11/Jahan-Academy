# Local GitHub Actions runner

## Configuration

The workflow targets `[self-hosted, linux, x64, jahan-local]`. GitHub service
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

GitHub reference: https://docs.github.com/en/actions/reference/runners/self-hosted-runners
