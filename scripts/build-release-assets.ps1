param(
  [string]$OutputDirectory = (Join-Path $PWD 'release')
)

$ErrorActionPreference = 'Stop'
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$version = (node -p "require('./package.json').version").Trim()
if ([string]::IsNullOrWhiteSpace($version)) { throw 'Could not resolve TinyManager version from package.json.' }
$tag = "v$version"

$webZip = Join-Path $OutputDirectory "TinyManager-Web-v$version.zip"
if (Test-Path $webZip) { Remove-Item $webZip -Force }
Compress-Archive -Path 'dist/*' -DestinationPath $webZip -Force

$portableName = "TinyManager-Windows-Portable-v$version"
$portableRoot = Join-Path $OutputDirectory $portableName
if (Test-Path $portableRoot) { Remove-Item $portableRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $portableRoot 'app') | Out-Null
Copy-Item -Path 'dist/*' -Destination (Join-Path $portableRoot 'app') -Recurse -Force
Copy-Item 'packaging/windows/Start-TinyManager.ps1' $portableRoot
Copy-Item 'packaging/windows/Start-TinyManager.cmd' $portableRoot
Copy-Item 'packaging/windows/README-PORTABLE.txt' $portableRoot
$portableZip = Join-Path $OutputDirectory "$portableName.zip"
if (Test-Path $portableZip) { Remove-Item $portableZip -Force }
Compress-Archive -Path "$portableRoot/*" -DestinationPath $portableZip -Force

$iscc = (Get-Command ISCC.exe -ErrorAction SilentlyContinue).Source
if (-not $iscc) { $iscc = 'C:\Program Files (x86)\Inno Setup 6\ISCC.exe' }
if (-not (Test-Path $iscc)) { throw 'ISCC.exe was not found. Install Inno Setup 6 first.' }

& $iscc "/DAppVersion=$version" "/DOutputDir=$OutputDirectory" 'packaging/windows/TinyManager.iss'
if ($LASTEXITCODE -ne 0) { throw 'Inno Setup compilation failed.' }

$setup = Join-Path $OutputDirectory "TinyManager-Setup-v$version.exe"
if (-not (Test-Path $setup)) { throw "Expected setup asset not found: $setup" }

$sourcePs = Join-Path $OutputDirectory "TinyManager-Source-Installer-v$version.ps1"
$sourceSh = Join-Path $OutputDirectory "TinyManager-Source-Installer-v$version.sh"
$registryAsset = Join-Path $OutputDirectory "TinyManager-Repositories-v$version.json"
Copy-Item 'scripts/bootstrap-source.ps1' $sourcePs -Force
Copy-Item 'scripts/bootstrap-source.sh' $sourceSh -Force
Copy-Item 'config/repositories.json' $registryAsset -Force

$assets = @($setup, $portableZip, $webZip, $sourcePs, $sourceSh, $registryAsset)
$checksums = foreach ($asset in $assets) {
  $hash = (Get-FileHash -Algorithm SHA256 $asset).Hash.ToLowerInvariant()
  "$hash  $([IO.Path]::GetFileName($asset))"
}
$checksumPath = Join-Path $OutputDirectory 'SHA256SUMS.txt'
$checksums | Set-Content -Path $checksumPath -Encoding ASCII

$manifest = [ordered]@{
  version = $version
  tag = $tag
  setup = $setup
  portable = $portableZip
  web = $webZip
  sourcePs = $sourcePs
  sourceSh = $sourceSh
  registry = $registryAsset
  checksums = $checksumPath
}
$manifestPath = Join-Path $OutputDirectory 'release-manifest.json'
$manifest | ConvertTo-Json | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "Release assets built for $tag" -ForegroundColor Green
$assets + $checksumPath | ForEach-Object { Write-Host "- $_" }
Write-Output $manifestPath
