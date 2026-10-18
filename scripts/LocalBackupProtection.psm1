Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Local Windows safety copies. Production/offsite backups continue to use age.
$script:Limit = 128MB

function Initialize-Protection {
    if (-not $IsWindows) { throw 'DPAPI protection requires Windows; no plaintext fallback is allowed.' }
    Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
}

function Get-BackupHash([byte[]]$Bytes) {
    [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($Bytes))
}

function Read-ProtectedBackup {
    [OutputType([byte[]])]
    param([Parameter(Mandatory)][string]$LiteralPath)
    Initialize-Protection
    $item = Get-Item -LiteralPath $LiteralPath -Force
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -or $item.Length -gt ($script:Limit + 1MB)) {
        throw 'Unsupported backup file or size.'
    }
    $cipher = [IO.File]::ReadAllBytes($item.FullName)
    return ,([Security.Cryptography.ProtectedData]::Unprotect(
        $cipher, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser
    ))
}

function Write-ProtectedBackup {
    param([Parameter(Mandatory)][string]$LiteralPath,
          [Parameter(Mandatory)][AllowEmptyCollection()][byte[]]$Bytes)
    Initialize-Protection
    if ($Bytes.Length -gt $script:Limit) { throw 'Backup exceeds the local 128-MiB protection limit; use streaming age encryption.' }
    $target = [IO.Path]::GetFullPath($LiteralPath)
    if ([IO.Path]::GetExtension($target) -ne '.dpapi') { throw 'Encrypted backup must end in .dpapi.' }
    if (Test-Path -LiteralPath $target) { throw 'Backup destination already exists; no file overwritten.' }
    $partial = $target + '.partial-' + [Guid]::NewGuid().ToString('N')
    try {
        $cipher = [Security.Cryptography.ProtectedData]::Protect(
            $Bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser
        )
        $stream = [IO.File]::Open($partial, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
        try { $stream.Write($cipher, 0, $cipher.Length); $stream.Flush($true) }
        finally { $stream.Dispose() }
        # Verify the actual ciphertext read from disk before publishing or deleting a source.
        [byte[]]$restored = Read-ProtectedBackup -LiteralPath $partial
        if ((Get-BackupHash $Bytes) -ne (Get-BackupHash $restored)) { throw 'Encrypted backup verification failed.' }
        [IO.File]::Move($partial, $target) # Same-directory atomic rename; no overwrite.
    }
    finally {
        if (Test-Path -LiteralPath $partial) { Remove-Item -LiteralPath $partial -Force }
    }
}

function Protect-LocalBackupFile {
    param([Parameter(Mandatory)][string]$LiteralPath)
    $item = Get-Item -LiteralPath $LiteralPath -Force
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -or $item.Length -gt $script:Limit) {
        throw 'Unsupported source file or size; plaintext retained.'
    }
    if ($item.Extension -eq '.dpapi') { throw 'Source is already an encrypted backup.' }
    $source = $item.FullName
    $target = $source + '.dpapi'
    [byte[]]$plain = [IO.File]::ReadAllBytes($source)
    $originalHash = Get-BackupHash $plain
    if (-not (Test-Path -LiteralPath $target)) {
        Write-ProtectedBackup -LiteralPath $target -Bytes $plain
    }
    [byte[]]$restored = Read-ProtectedBackup -LiteralPath $target
    if ($originalHash -ne (Get-BackupHash $restored)) { throw 'Existing ciphertext differs; plaintext retained.' }
    # Fail closed if another process changed the source during encryption.
    if ($originalHash -ne (Get-BackupHash ([IO.File]::ReadAllBytes($source)))) {
        throw 'Source changed during protection; plaintext retained.'
    }
    Remove-Item -LiteralPath $source -Force
    return $target
}

function Remove-ExpiredProtectedOutbox {
    param([Parameter(Mandatory)][string]$Directory, [ValidateRange(1,14)][int]$RetentionDays = 14)
    $root = [IO.Path]::GetFullPath($Directory)
    $cutoff = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'Iran Standard Time').Date.AddDays(-$RetentionDays)
    foreach ($item in Get-ChildItem -LiteralPath $root -File -Force) {
        if ($item.Name -notmatch '^(\d{4}-\d{2}-\d{2})(?:-[a-f0-9]{32})?\.json\.dpapi$') { continue }
        $day = [DateTime]::ParseExact($Matches[1], 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
        if ($day -le $cutoff) {
            # Never delete a foreign/corrupt file merely because its name resembles an outbox.
            $null = Read-ProtectedBackup -LiteralPath $item.FullName
            Remove-Item -LiteralPath $item.FullName -Force
        }
    }
}

Export-ModuleMember -Function Write-ProtectedBackup, Read-ProtectedBackup, Protect-LocalBackupFile, Remove-ExpiredProtectedOutbox
