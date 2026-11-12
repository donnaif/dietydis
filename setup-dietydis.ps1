# DietyDis setup: downloads Vencord + Vesktop, adds DietyDis plugins, rebrands, builds and runs.
#   .\run-setup.bat            build and start DietyDis
#   .\run-setup.bat -Package   also build the Windows installer (.exe)
param(
    [switch]$Package,
    [switch]$NoStart,
    [string]$SrcDir = (Join-Path $env:USERPROFILE "DietyDis-src")
)

$ErrorActionPreference = "Stop"
$Kit = $PSScriptRoot

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Run($exe, [string[]]$argv) {
    & $exe @argv
    if ($LASTEXITCODE -ne 0) { throw "'$exe $($argv -join ' ')' failed (exit $LASTEXITCODE)" }
}

Step "Checking tools"
foreach ($tool in "git", "node") {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool is not installed" }
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found, enabling it with corepack"
    Run "corepack" @("enable")
}

New-Item -ItemType Directory -Force $SrcDir | Out-Null
$Vencord = Join-Path $SrcDir "Vencord"
$Vesktop = Join-Path $SrcDir "Vesktop"

Step "Getting source code"
if (-not (Test-Path $Vencord)) { Run "git" @("clone", "--depth", "1", "https://github.com/Vendicated/Vencord.git", $Vencord) }
if (-not (Test-Path $Vesktop)) { Run "git" @("clone", "--depth", "1", "https://github.com/Vencord/Vesktop.git", $Vesktop) }

Step "Copying DietyDis plugins into Vencord"
$userplugins = Join-Path $Vencord "src\userplugins"
# userplugins only ever holds our copies (it is git-ignored in Vencord), so start clean:
# a plugin removed from the kit must not linger in the build
if (Test-Path $userplugins) { Remove-Item $userplugins -Recurse -Force }
New-Item -ItemType Directory -Force $userplugins | Out-Null
Get-ChildItem (Join-Path $Kit "plugins") -Directory | ForEach-Object {
    $dest = Join-Path $userplugins $_.Name
    Copy-Item $_.FullName $dest -Recurse
    Write-Host "  + $($_.Name)"
}

Step "Building Vencord"
Push-Location $Vencord
try {
    Run "pnpm" @("install", "--frozen-lockfile")
    # standalone + no updater: Vencord must never replace itself with upstream (it would drop our plugins)
    Run "pnpm" @("build", "--standalone", "--disable-updater")
} finally { Pop-Location }

Step "Rebranding Vesktop to DietyDis"
Push-Location $Vesktop
try {
    Run "pnpm" @("install")
    # Some pnpm versions skip Electron's postinstall, so fetch the binary if it is missing
    if (-not (Test-Path (Join-Path $Vesktop "node_modules\electron\dist\electron.exe"))) {
        Write-Host "  downloading the Electron binary"
        Push-Location (Join-Path $Vesktop "node_modules\electron")
        try { Run "node" @("install.js") } finally { Pop-Location }
    }
    Run "node" @((Join-Path $Kit "scripts\rebrand.mjs"), $Vesktop, (Join-Path $Kit "assets\icon.ico"), (Join-Path $Vencord "dist"))
} finally { Pop-Location }

Step "Pointing DietyDis at our Vencord build"
$dataDir = Join-Path $env:APPDATA "DietyDis"
New-Item -ItemType Directory -Force $dataDir | Out-Null
$stateFile = Join-Path $dataDir "state.json"
$state = [ordered]@{}
if (Test-Path $stateFile) {
    try { (Get-Content $stateFile -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $state[$_.Name] = $_.Value } } catch {}
}
$state["vencordDir"] = (Join-Path $Vencord "dist")
# Skip Vesktop's first-launch tour: its window can stay blank and block startup
if (-not $state.Contains("firstLaunch")) { $state["firstLaunch"] = $false }
$state | ConvertTo-Json -Depth 10 | Set-Content $stateFile -Encoding utf8
Write-Host "  vencordDir = $($state['vencordDir'])"

Push-Location $Vesktop
try {
    if ($Package) {
        Step "Building the Windows installer"
        Run "pnpm" @("build")
        Run "pnpm" @("exec", "electron-builder", "--win", "nsis", "--x64")
        $exe = Get-ChildItem (Join-Path $Vesktop "dist") -Filter "DietyDis-Setup-*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        Write-Host "`nInstaller: $($exe.FullName)" -ForegroundColor Green
    }
    if (-not $NoStart) {
        Step "Starting DietyDis"
        Run "pnpm" @("start")
    }
} finally { Pop-Location }
