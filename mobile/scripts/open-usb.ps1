# Explicit user-invoked launch: avoid a remembered Wi-Fi/tunnel development URL.
$ErrorActionPreference = 'Stop'
$taskAdb = Get-Command adb -ErrorAction Stop
$taskInstalled = & $taskAdb.Source shell pm path com.smishguard.app
if ($LASTEXITCODE -ne 0 -or !($taskInstalled -match '^package:')) {
    throw 'Install the SmishGuard development APK on the USB phone before running npm run open:usb.'
}
$taskManifest = Invoke-RestMethod 'http://127.0.0.1:8081/?platform=android' -Headers @{Accept = 'application/json'; 'expo-platform' = 'android' } -TimeoutSec 30
if (([uri]$taskManifest.launchAsset.url).Host -ne '127.0.0.1') {
    throw 'Metro advertises a non-USB URL. Stop the other Metro terminal and start npm run start:usb first.'
}
& $taskAdb.Source reverse tcp:8081 tcp:8081
if ($LASTEXITCODE -ne 0) { throw 'Could not forward port 8081. Connect one authorized USB-debugging phone.' }
& $taskAdb.Source reverse tcp:8000 tcp:8000
& $taskAdb.Source shell am start -W -a android.intent.action.VIEW -d 'smishguard://?__expo_url=http%3A%2F%2F127.0.0.1%3A8081' -p com.smishguard.app
exit $LASTEXITCODE
