# Keep the development bundle and lazy chunks on the same IPv4 USB endpoint.
$ErrorActionPreference = 'Stop'
$taskMobileRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskExistingNodeOptions = $env:NODE_OPTIONS
$taskExistingHostname = $env:REACT_NATIVE_PACKAGER_HOSTNAME
$taskExistingProxy = $env:EXPO_PACKAGER_PROXY_URL
try {
    if (Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 8081 already has a server. Stop the other Expo/Metro terminal with Ctrl+C, then run npm run start:usb again.'
    }
    $env:NODE_OPTIONS = ($taskExistingNodeOptions + ' --dns-result-order=ipv4first').Trim()
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = '127.0.0.1'
    Remove-Item Env:EXPO_PACKAGER_PROXY_URL -ErrorAction SilentlyContinue
    $taskAdb = Get-Command adb -ErrorAction SilentlyContinue
    if ($taskAdb) {
        $taskDeviceReady = $false
        try {
            $taskDeviceState = & $taskAdb.Source get-state 2>$null
            $taskDeviceReady = $LASTEXITCODE -eq 0 -and $taskDeviceState -eq 'device'
        } catch { $taskDeviceReady = $false }
        if ($taskDeviceReady) {
            & $taskAdb.Source reverse tcp:8081 tcp:8081
            & $taskAdb.Source reverse tcp:8000 tcp:8000
        } else {
            Write-Warning 'Connect one USB-debugging phone, approve debugging, then reverse ports 8081 and 8000 with adb.'
        }
    }
    Push-Location $taskMobileRoot
    try {
        npx.cmd expo start --dev-client --localhost --port 8081 @args
        $taskExitCode = $LASTEXITCODE
    } finally { Pop-Location }
} finally {
    $env:NODE_OPTIONS = $taskExistingNodeOptions
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $taskExistingHostname
    $env:EXPO_PACKAGER_PROXY_URL = $taskExistingProxy
}
exit $taskExitCode
