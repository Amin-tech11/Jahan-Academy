param([Parameter(Mandatory)][string[]]$LiteralPath, [switch]$Apply)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'LocalBackupProtection.psm1') -Force
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')) + [IO.Path]::DirectorySeparatorChar
$taskResults = foreach ($path in $LiteralPath) {
    $resolved = [IO.Path]::GetFullPath($path)
    if (-not $resolved.StartsWith($taskRoot, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Backup must be inside this checkout; no external path processed.'
    }
    if ($Apply) {
        if (Test-Path -LiteralPath $resolved) {
            $encrypted = Protect-LocalBackupFile -LiteralPath $resolved
        } elseif (Test-Path -LiteralPath ($resolved + '.dpapi')) {
            $encrypted = $resolved + '.dpapi'
        } else { throw 'Neither source nor verified encrypted backup exists.' }
        [byte[]]$restored = Read-ProtectedBackup -LiteralPath $encrypted
        [ordered]@{ path = $encrypted; status = 'verified-encrypted'; plaintextRemoved = -not (Test-Path -LiteralPath $resolved)
            restoredSha256 = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($restored)) }
    } else {
        [ordered]@{ path = $resolved; status = 'dry-run'; exists = (Test-Path -LiteralPath $resolved) }
    }
}
$taskResults | ConvertTo-Json -Depth 3
