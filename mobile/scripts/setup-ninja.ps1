# Project-local Ninja: the Android CMake 3.22.1 bundle contains Ninja 1.10.2,
# which cannot handle this project's generated Windows paths.
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskTools = Join-Path $taskRoot '.setup/tools/ninja-1.13.2'
$taskNinja = Join-Path $taskTools 'ninja.exe'
$taskExpectedHash = '07fc8261b42b20e71d1720b39068c2e14ffcee6396b76fb7a795fb460b78dc65'
$taskExpectedExeHash = 'e52a7ad9538d9618c67a0bd777964e2eec8a30f68b810a2f6adce1f2daf847b8'
if (Test-Path -LiteralPath $taskNinja) {
    $taskActualHash = (Get-FileHash -LiteralPath $taskNinja -Algorithm SHA256).Hash
    if ($taskActualHash.ToLowerInvariant() -eq $taskExpectedExeHash) { return }
}
New-Item -ItemType Directory -Path $taskTools -Force | Out-Null
$taskArchive = Join-Path $taskTools 'ninja-win.zip'
Invoke-WebRequest -Uri 'https://github.com/ninja-build/ninja/releases/download/v1.13.2/ninja-win.zip' -OutFile $taskArchive
if ((Get-FileHash -LiteralPath $taskArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskExpectedHash) {
    throw 'Official Ninja archive checksum mismatch; refusing to extract.'
}
Expand-Archive -LiteralPath $taskArchive -DestinationPath $taskTools -Force -ErrorAction Stop
if ((Get-FileHash -LiteralPath $taskNinja -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskExpectedExeHash) {
    throw 'Extracted Ninja executable checksum mismatch.'
}
Write-Host 'Verified project-local Ninja 1.13.2 is ready.'
