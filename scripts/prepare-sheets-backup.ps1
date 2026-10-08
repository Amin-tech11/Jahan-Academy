param(
    [ValidatePattern('^\d{4}-\d{2}-\d{2}$')]
    [string]$Day,
    [string]$ApiContainer = 'jahan-admin-access-api',
    [string]$Network = 'jahan-academy_application'
)

$ErrorActionPreference = 'Stop'
$taskBackend = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../backend'))
if (-not (Test-Path -LiteralPath (Join-Path $taskBackend '.venv/pyvenv.cfg'))) {
    throw 'The backend Linux test environment is missing. Follow GOOGLE_SHEETS_BACKUP.md to prepare it.'
}
$taskInspection = docker inspect $ApiContainer
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect the configured admin API container.' }
$taskApi = ($taskInspection | ConvertFrom-Json)[0]
if (-not $taskApi.State.Running) { throw 'The configured admin API container is not running.' }
$taskDbEnv = @($taskApi.Config.Env | Where-Object { $_.StartsWith('JAHAN_DATABASE_URL=') })[0]
$taskNetworks = @($taskApi.NetworkSettings.Networks.PSObject.Properties.Name)
if (-not $taskDbEnv -or $Network -notin $taskNetworks) {
    throw 'Expected the admin database configuration and the configured application network.'
}
# The existing app's database configuration is passed in memory, never printed or saved.
$taskDockerArgs = @(
    'run', '--rm', '--pull=never', '--read-only',
    '--network', $Network, '--env', $taskDbEnv,
    '--env', 'PYTHONDONTWRITEBYTECODE=1',
    '--mount', "type=bind,source=$taskBackend,target=/work,readonly",
    '--workdir', '/work', '--entrypoint', '/work/.venv/bin/python',
    'ghcr.io/astral-sh/uv:python3.12-bookworm-slim',
    '-m', 'app.modules.operational.sheets_backup', '--prepare-only'
)
if ($Day) { $taskDockerArgs += $Day }
$taskJson = (& docker @taskDockerArgs) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Daily snapshot preparation failed; do not write a partial backup.' }
$taskPayload = $taskJson | ConvertFrom-Json
$taskOutbox = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.backup-outbox'))
[System.IO.Directory]::CreateDirectory($taskOutbox) | Out-Null
$taskOutput = Join-Path $taskOutbox ($taskPayload.day + '.json')
[System.IO.File]::WriteAllText($taskOutput, $taskJson, [System.Text.UTF8Encoding]::new($false))
[ordered]@{
    day = $taskPayload.day
    rowCount = $taskPayload.rowCount
    sheetTitle = $taskPayload.sheetTitle
    sheetId = $taskPayload.sheetId
    payloadPath = $taskOutput
} | ConvertTo-Json -Compress
