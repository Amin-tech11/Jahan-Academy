$ErrorActionPreference = 'Stop'
# This checkout's API uses the bind-mounted develop code. No credentials in arguments.
& docker exec jahan-develop-access-api /app/.venv/bin/python -B -m app.modules.identity.security_notifications --apply
if ($LASTEXITCODE -ne 0) { throw 'Security notification dispatcher failed; pending records retained.' }
