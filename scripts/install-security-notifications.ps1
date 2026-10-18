$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'This local dispatcher schedule requires Windows.' }
$taskScript = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'dispatch-security-notices.ps1'))
$taskSuffix = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($taskScript))).Substring(0,12)
$taskName = "Jahan-Develop-SecurityNotices-$taskSuffix"
$taskUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$taskExecutable = (Get-Process -Id $PID).Path
$taskArguments = '-NoProfile -NonInteractive -WindowStyle Hidden -File "' + $taskScript + '"'
$taskExisting = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($taskExisting -and ($taskExisting.Actions.Execute -ne $taskExecutable -or $taskExisting.Actions.Arguments -ne $taskArguments)) {
    throw 'A different scheduled task already uses this name; nothing overwritten.'
}
$taskAction = New-ScheduledTaskAction -Execute $taskExecutable -Argument $taskArguments
$taskTriggers = @((New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)), (New-ScheduledTaskTrigger -AtLogOn -User $taskUser))
$taskPrincipal = New-ScheduledTaskPrincipal -UserId $taskUser -LogonType Interactive -RunLevel Limited
$taskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTriggers -Principal $taskPrincipal -Settings $taskSettings -Force | Out-Null
@{status='installed'; taskName=$taskName; schedule='every minute and current-user logon'; scope='develop API security notification queue only'} | ConvertTo-Json -Compress
