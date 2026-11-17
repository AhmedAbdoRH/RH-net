$s = New-Object -ComObject WScript.Shell
$lnk = $s.CreateShortcut("$env:USERPROFILE\Desktop\Grok.lnk")
Write-Host "Target: $($lnk.TargetPath)"
Write-Host "Arguments: $($lnk.Arguments)"
Write-Host "WorkingDirectory: $($lnk.WorkingDirectory)"