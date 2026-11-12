# Publishes a new DietyDis version: users get it through the in-app updater.
#   .\release.ps1 -Version 1.0.1 -Notes "ما الجديد في هذه النسخة"
# Steps: set version -> build installer -> commit + tag -> push -> GitHub release with the update files.
# Needs: GitHub CLI logged in (gh auth login), a clean git working tree.
param(
    [Parameter(Mandatory)][string]$Version,
    [string]$Notes = ""
)

$ErrorActionPreference = "Stop"
$Kit = $PSScriptRoot
Set-Location $Kit

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Run($exe, [string[]]$argv) {
    & $exe @argv
    if ($LASTEXITCODE -ne 0) { throw "'$exe $($argv -join ' ')' failed (exit $LASTEXITCODE)" }
}

$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) { $gh = "C:\Program Files\GitHub CLI\gh.exe" }
if (-not (Test-Path $gh)) { throw "GitHub CLI not found. Install it: winget install GitHub.cli" }
& $gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI is not logged in. Run: gh auth login --web" }

if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw "Version must look like 1.2.3" }
$configPath = Join-Path $Kit "dietydis.config.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json
if ([version]$Version -le [version]$config.version) {
    throw "Version $Version must be higher than the current $($config.version), or users will not get the update"
}
if (git status --porcelain) { throw "Commit or discard your changes first (git status is not clean)" }
$tag = "v$Version"
if (git tag --list $tag) { throw "Tag $tag already exists" }

Step "Setting version $Version"
$config.version = $Version
$config | ConvertTo-Json -Depth 5 | Set-Content $configPath -Encoding utf8

Step "Building the installer"
& (Join-Path $Kit "setup-dietydis.ps1") -Package -NoStart
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "Build failed" }

$dist = Join-Path $env:USERPROFILE "DietyDis-src\Vesktop\dist"
$files = @(
    (Join-Path $dist "DietyDis-Setup-$Version.exe"),
    (Join-Path $dist "DietyDis-Setup-$Version.exe.blockmap"),
    (Join-Path $dist "latest.yml")   # what the in-app updater reads
)
foreach ($f in $files) { if (-not (Test-Path $f)) { throw "Missing build output: $f" } }
if (-not (Select-String -Path (Join-Path $dist "latest.yml") -Pattern "version: $([regex]::Escape($Version))" -Quiet)) {
    throw "latest.yml does not describe version $Version"
}

Step "Commit, tag and push"
Run "git" @("add", "dietydis.config.json")
Run "git" @("commit", "-m", "Release $tag")
Run "git" @("tag", "-a", $tag, "-m", "DietyDis $tag")
Run "git" @("push", "--follow-tags")

Step "Publishing the GitHub release"
$releaseArgs = @("release", "create", $tag) + $files + @("--title", "DietyDis $tag")
if ($Notes) { $releaseArgs += @("--notes", $Notes) } else { $releaseArgs += "--generate-notes" }
Run $gh $releaseArgs

Write-Host "`nReleased DietyDis $tag. Installed copies will offer the update on their next start." -ForegroundColor Green
