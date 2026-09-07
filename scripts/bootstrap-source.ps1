param(
  [string]$Workspace = (Join-Path $env:USERPROFILE 'TinyManagerWorkspace'),
  [switch]$InstallAll
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Refresh-Path {
  $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $user = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machine;$user"
}

function Ensure-Tool {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$WingetId,
    [Parameter(Mandatory = $true)][string]$DisplayName
  )

  if (Get-Command $Command -ErrorAction SilentlyContinue) { return }

  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw "$DisplayName is required and winget is not available for automatic installation."
  }

  Write-Host "Installing $DisplayName..." -ForegroundColor Cyan
  & winget install --id $WingetId -e --silent --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { throw "Could not install $DisplayName using winget." }
  Refresh-Path

  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "$DisplayName was installed but is not available in PATH yet. Reopen PowerShell and run this script again."
  }
}

Ensure-Tool -Command 'git' -WingetId 'Git.Git' -DisplayName 'Git'
Ensure-Tool -Command 'node' -WingetId 'OpenJS.NodeJS.LTS' -DisplayName 'Node.js LTS'
Ensure-Tool -Command 'npm' -WingetId 'OpenJS.NodeJS.LTS' -DisplayName 'npm'

New-Item -ItemType Directory -Force -Path $Workspace | Out-Null
$corePath = Join-Path $Workspace 'tinymanager'

if (-not (Test-Path (Join-Path $corePath '.git'))) {
  if ((Test-Path $corePath) -and ((Get-ChildItem -Force $corePath | Measure-Object).Count -gt 0)) {
    throw "$corePath exists but is not a Git repository."
  }
  Write-Host 'Downloading TinyManager Core...' -ForegroundColor Cyan
  git clone https://github.com/webtanan-sketch/tinymanager.git $corePath
  if ($LASTEXITCODE -ne 0) { throw 'Could not clone TinyManager Core.' }
} else {
  Push-Location $corePath
  try {
    if ((git status --porcelain)) { throw 'TinyManager Core has local changes. Commit or stash them before automatic update.' }
    git checkout main
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw 'Could not update TinyManager Core.' }
  } finally {
    Pop-Location
  }
}

Push-Location $corePath
try {
  node scripts/verify-repositories.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Repository registry verification failed.' }

  $syncArgs = @('scripts/sync-repositories.mjs', "--workspace=$Workspace", '--install-core')
  if ($InstallAll) { $syncArgs += '--install-all' }
  node @syncArgs
  if ($LASTEXITCODE -ne 0) { throw 'Repository synchronization failed.' }
} finally {
  Pop-Location
}

Write-Host ''
Write-Host 'TinyManager source workspace is ready.' -ForegroundColor Green
Write-Host "Core: $corePath"
Write-Host 'Run: npm run dev (inside the Core folder)'
