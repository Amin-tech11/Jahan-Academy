param([string]$Directory = (Join-Path $PSScriptRoot '../.backup-outbox'), [switch]$Apply)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'LocalBackupProtection.psm1') -Force
if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
    @{status='not_created'; apply=[bool]$Apply} | ConvertTo-Json -Compress
    exit 0
}
if ($Apply) { Remove-ExpiredProtectedOutbox -Directory $Directory }
@{status='completed'; apply=[bool]$Apply; checkedAt=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json -Compress
