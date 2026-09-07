param(
  [int]$PreferredPort = 47831,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appRoot = Join-Path $scriptRoot 'app'
if (-not (Test-Path (Join-Path $appRoot 'index.html'))) {
  if (Test-Path (Join-Path $scriptRoot 'index.html')) {
    $appRoot = $scriptRoot
  } else {
    throw 'TinyManager app files were not found.'
  }
}

$stateDirectory = Join-Path $env:LOCALAPPDATA 'TinyManager'
New-Item -ItemType Directory -Force -Path $stateDirectory | Out-Null
$portFile = Join-Path $stateDirectory 'server-port.txt'

function Test-TinyManagerEndpoint {
  param([int]$Port)
  try {
    $response = Invoke-WebRequest "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 1
    return $response.StatusCode -eq 200 -and $response.Headers['X-TinyManager-Server'] -eq '1'
  } catch {
    return $false
  }
}

if (Test-TinyManagerEndpoint $PreferredPort) {
  Set-Content -Path $portFile -Value $PreferredPort -Encoding ASCII
  if (-not $NoBrowser) { Start-Process "http://127.0.0.1:$PreferredPort/#/" }
  exit 0
}

if (Test-Path $portFile) {
  Remove-Item $portFile -Force -ErrorAction SilentlyContinue
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $PreferredPort)
try {
  $listener.Start()
} catch {
  throw "TinyManager requires its fixed localhost port $PreferredPort to preserve local IndexedDB data, but that port is already in use by another application. Close that application and start TinyManager again."
}

$port = $PreferredPort
Set-Content -Path $portFile -Value $port -Encoding ASCII

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.svg' = 'image/svg+xml'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif' = 'image/gif'
  '.webp' = 'image/webp'
  '.ico' = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2' = 'font/woff2'
  '.txt' = 'text/plain; charset=utf-8'
}

function Write-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType = 'text/plain; charset=utf-8',
    [hashtable]$ExtraHeaders = @{},
    [switch]$HeadOnly
  )

  $headers = "HTTP/1.1 $StatusCode $StatusText`r`n" +
    "Content-Type: $ContentType`r`n" +
    "Content-Length: $($Body.Length)`r`n" +
    "Connection: close`r`n" +
    "X-Content-Type-Options: nosniff`r`n" +
    "X-TinyManager-Server: 1`r`n"
  foreach ($key in $ExtraHeaders.Keys) { $headers += "$key`: $($ExtraHeaders[$key])`r`n" }
  $headers += "`r`n"

  $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headers)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
}

if (-not $NoBrowser) { Start-Process "http://127.0.0.1:$port/#/" }
Write-Host "TinyManager is running at http://127.0.0.1:$port/#/"
Write-Host 'Close this process to stop the local app server.'

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }

      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2) {
        Write-Response -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -Body ([Text.Encoding]::UTF8.GetBytes('Bad Request'))
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        Write-Response -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -Body ([Text.Encoding]::UTF8.GetBytes('Method Not Allowed'))
        continue
      }

      $requestPath = $parts[1].Split('?')[0]
      $decodedPath = [System.Uri]::UnescapeDataString($requestPath)
      if ($decodedPath -eq '/') { $decodedPath = '/index.html' }

      $relativePath = $decodedPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
      $candidatePath = [IO.Path]::GetFullPath((Join-Path $appRoot $relativePath))
      $rootFullPath = [IO.Path]::GetFullPath($appRoot + [IO.Path]::DirectorySeparatorChar)

      if (-not $candidatePath.StartsWith($rootFullPath, [StringComparison]::OrdinalIgnoreCase)) {
        Write-Response -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -Body ([Text.Encoding]::UTF8.GetBytes('Forbidden'))
        continue
      }

      if (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
        if ([string]::IsNullOrEmpty([IO.Path]::GetExtension($decodedPath))) {
          $candidatePath = Join-Path $appRoot 'index.html'
        } else {
          Write-Response -Stream $stream -StatusCode 404 -StatusText 'Not Found' -Body ([Text.Encoding]::UTF8.GetBytes('Not Found'))
          continue
        }
      }

      $extension = [IO.Path]::GetExtension($candidatePath).ToLowerInvariant()
      $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
      $body = [IO.File]::ReadAllBytes($candidatePath)
      $extra = @{}

      if ([IO.Path]::GetFileName($candidatePath) -eq 'sw.js') {
        $extra['Service-Worker-Allowed'] = '/'
        $extra['Cache-Control'] = 'no-cache, no-store, must-revalidate'
      } elseif ($extension -eq '.html' -or [IO.Path]::GetFileName($candidatePath) -eq 'registerSW.js') {
        $extra['Cache-Control'] = 'no-cache'
      } else {
        $extra['Cache-Control'] = 'public, max-age=31536000, immutable'
      }

      Write-Response -Stream $stream -StatusCode 200 -StatusText 'OK' -Body $body -ContentType $contentType -ExtraHeaders $extra -HeadOnly:($method -eq 'HEAD')
    } catch {
      try {
        if ($stream) {
          Write-Response -Stream $stream -StatusCode 500 -StatusText 'Internal Server Error' -Body ([Text.Encoding]::UTF8.GetBytes('Internal Server Error'))
        }
      } catch {}
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
  if (Test-Path $portFile) {
    $savedPort = (Get-Content $portFile -Raw).Trim()
    if ($savedPort -eq [string]$port) { Remove-Item $portFile -Force -ErrorAction SilentlyContinue }
  }
}
