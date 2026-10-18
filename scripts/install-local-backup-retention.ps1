$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'This schedule requires Windows and the originating DPAPI user.' }
$taskScript = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'cleanup-local-backups.ps1'))
$taskSuffix = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($taskScript))).Substring(0,12)
$taskName = "Jahan-Develop-BackupRetention-$taskSuffix"
$taskUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$taskExecutable = (Get-Process -Id $PID).Path
$taskArguments = '-NoProfile -NonInteractive -WindowStyle Hidden -File "' + $taskScript + '" -Apply'
$taskExisting = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($taskExisting -and ($taskExisting.Actions.Execute -ne $taskExecutable -or $taskExisting.Actions.Arguments -ne $taskArguments)) {
    throw 'A different scheduled task already uses this name; nothing overwritten.'
}
$taskAction = New-ScheduledTaskAction -Execute $taskExecutable -Argument $taskArguments
$taskTriggers = @((New-ScheduledTaskTrigger -Daily -At '09:00'), (New-ScheduledTaskTrigger -AtLogOn -User $taskUser))
$taskPrincipal = New-ScheduledTaskPrincipal -UserId $taskUser -LogonType Interactive -RunLevel Limited
$taskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTriggers -Principal $taskPrincipal -Settings $taskSettings -Force | Out-Null
@{status='installed'; taskName=$taskName; schedule='daily 09:00 and current-user logon'; scope='this checkout protected daily outbox only'} | ConvertTo-Json -Compress
