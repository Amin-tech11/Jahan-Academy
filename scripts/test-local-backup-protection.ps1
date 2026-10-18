param([Parameter(Mandatory)][string]$TestDirectory)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'LocalBackupProtection.psm1') -Force
if (Test-Path -LiteralPath $TestDirectory) { throw 'Test directory must be new.' }
[IO.Directory]::CreateDirectory($TestDirectory) | Out-Null
$taskBytes = [Text.Encoding]::UTF8.GetBytes('synthetic-only backup payload: آزمایش 0123456789')
$taskSource = Join-Path $TestDirectory 'sample.dump'
[IO.File]::WriteAllBytes($taskSource, $taskBytes)
$taskEncrypted = Protect-LocalBackupFile -LiteralPath $taskSource
if (Test-Path -LiteralPath $taskSource) { throw 'Plaintext was not removed.' }
if ([Convert]::ToHexString((Read-ProtectedBackup $taskEncrypted)) -ne [Convert]::ToHexString($taskBytes)) { throw 'Roundtrip differs.' }
$taskTampered = Join-Path $TestDirectory 'corrupt.dpapi'
$taskCipher = [IO.File]::ReadAllBytes($taskEncrypted)
$taskCipher[20] = $taskCipher[20] -bxor 1
[IO.File]::WriteAllBytes($taskTampered, $taskCipher)
$taskRejected = $false
try { $null = Read-ProtectedBackup $taskTampered } catch { $taskRejected = $true }
if (-not $taskRejected) { throw 'Tampered ciphertext was accepted.' }
$taskMismatch = Join-Path $TestDirectory 'mismatch.dump'
[IO.File]::WriteAllBytes($taskMismatch, $taskBytes)
Write-ProtectedBackup ($taskMismatch + '.dpapi') ([Text.Encoding]::UTF8.GetBytes('different synthetic content'))
$taskRejected = $false
try { $null = Protect-LocalBackupFile $taskMismatch } catch { $taskRejected = $true }
if (-not $taskRejected -or -not (Test-Path -LiteralPath $taskMismatch)) { throw 'Mismatched destination lost plaintext.' }
$taskLocked = Join-Path $TestDirectory 'locked.dump'
[IO.File]::WriteAllBytes($taskLocked, $taskBytes)
$taskLock = [IO.File]::Open($taskLocked, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
try {
    $taskRejected = $false
    try { $null = Protect-LocalBackupFile $taskLocked } catch { $taskRejected = $true }
    if (-not $taskRejected) { throw 'A locked source was not rejected.' }
} finally { $taskLock.Dispose() }
if (-not (Test-Path -LiteralPath $taskLocked)) { throw 'Locked source was lost.' }
$taskOutbox = Join-Path $TestDirectory 'outbox'
[IO.Directory]::CreateDirectory($taskOutbox) | Out-Null
$taskOld = Join-Path $taskOutbox '2000-01-01.json.dpapi'
$taskCurrent = Join-Path $taskOutbox ((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd') + '.json.dpapi')
$taskOther = Join-Path $taskOutbox 'manual.dump.dpapi'
Write-ProtectedBackup $taskOld $taskBytes
Write-ProtectedBackup $taskCurrent $taskBytes
Write-ProtectedBackup $taskOther $taskBytes
Remove-ExpiredProtectedOutbox -Directory $taskOutbox
if ((Test-Path $taskOld) -or -not (Test-Path $taskCurrent) -or -not (Test-Path $taskOther)) { throw 'Outbox cleanup scope violated.' }
Write-Output '6 local backup checks passed: roundtrip, plaintext removal, tamper, conflict, locked-source safety, scoped expiry.'
