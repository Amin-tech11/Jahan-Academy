param([switch]$Integration, [switch]$Lint, [switch]$BuildBackend)
$ErrorActionPreference = 'Stop'
$guestEpoch = & wsl.exe -d Ubuntu-24.04 -u root -- date -u +%s
if ($LASTEXITCODE -ne 0) { throw 'Cannot read the WSL clock.' }
$hostEpoch = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
if ([Math]::Abs([long]$guestEpoch.Trim() - $hostEpoch) -gt 5) {
    throw 'WSL clock differs from Windows by more than five seconds. Fix host/guest time synchronization before testing JWT sessions.'
}
$scriptPath = Join-Path $PSScriptRoot 'test-backend-local.sh'
$linuxPath = (& wsl.exe -d Ubuntu-24.04 -u root -- wslpath -a $scriptPath).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve the script path in Ubuntu-24.04.' }
$testArgs = @()
if ($Integration) { $testArgs += '--integration' }
if ($Lint) { $testArgs += '--lint' }
if ($BuildBackend) { $testArgs += '--build' }
& wsl.exe -d Ubuntu-24.04 -u root -- runuser -u jahan-ci -- bash $linuxPath @testArgs
exit $LASTEXITCODE
