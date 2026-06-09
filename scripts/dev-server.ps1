$ErrorActionPreference = "Stop"

Set-Location "C:\p4\avocard"

$node = "C:\p4\avocard\.tools\node-v22.11.0-win-x64\node.exe"
$next = "C:\p4\avocard\node_modules\next\dist\bin\next"
$log = "C:\p4\avocard\.next-dev.log"
$err = "C:\p4\avocard\.next-dev.err.log"

"Starting Avocard dev server at $(Get-Date -Format o)" | Out-File -FilePath $log -Encoding utf8
& $node $next dev --webpack -H 127.0.0.1 -p 3000 1>> $log 2>> $err
