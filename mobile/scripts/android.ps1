# Project-local workaround for Windows Java UNIX socket temporary-path limits.
$ErrorActionPreference = 'Stop'
$taskMobile = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskRoot = [IO.Path]::GetFullPath((Join-Path $taskMobile '..'))
$taskTemp = Join-Path $taskRoot '.setup\jtmp'
New-Item -ItemType Directory -Path $taskTemp -Force | Out-Null
$env:TEMP = $taskTemp
$env:TMP = $taskTemp
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir="' + $taskTemp + '"'
Push-Location $taskMobile
try { npx.cmd expo run:android } finally { Pop-Location }
