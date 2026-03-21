$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return Split-Path -Parent $PSScriptRoot
}

function Set-WranglerPaths {
  $configHome = Join-Path $env:USERPROFILE ".config"
  $cacheHome = Join-Path $env:LOCALAPPDATA "wrangler-cache"
  $wranglerHome = Join-Path $env:USERPROFILE ".wrangler"

  New-Item -ItemType Directory -Force -Path $configHome | Out-Null
  New-Item -ItemType Directory -Force -Path $cacheHome | Out-Null
  New-Item -ItemType Directory -Force -Path $wranglerHome | Out-Null

  $env:XDG_CONFIG_HOME = $configHome
  $env:XDG_CACHE_HOME = $cacheHome
  $env:WRANGLER_HOME = $wranglerHome
}

function Get-KeyValueMap([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) {
    return $map
  }

  foreach ($line in Get-Content $path) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) {
      continue
    }

    $parts = $line -split "=", 2
    if ($parts.Length -eq 2) {
      $map[$parts[0].Trim()] = $parts[1].Trim()
    }
  }

  return $map
}

function Get-OrCreateDatabaseId([string]$databaseName) {
  $databasesJson = npx wrangler d1 list --json
  $databases = $databasesJson | ConvertFrom-Json
  $existing = $databases | Where-Object { $_.name -eq $databaseName } | Select-Object -First 1
  if ($existing) {
    return $existing.uuid
  }

  $createOutput = npx wrangler d1 create $databaseName --location eeur
  $match = [regex]::Match(($createOutput -join "`n"), '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
  if (-not $match.Success) {
    throw "Could not parse D1 database_id from Wrangler output."
  }

  return $match.Value
}

function Update-ConfigFile([string]$path, [string]$databaseId) {
  $content = Get-Content $path -Raw
  $content = [regex]::Replace($content, 'database_id"\s*:\s*"[^"]+"', ('database_id": "' + $databaseId + '"'))
  $content = [regex]::Replace($content, 'database_id\s*=\s*"[^"]+"', ('database_id  = "' + $databaseId + '"'))
  Set-Content -Path $path -Value $content -NoNewline
}

function Set-Secret([string]$key, [string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    return
  }

  $value | npx wrangler secret put $key | Out-Null
}

$repoRoot = Get-RepoRoot
Set-Location $repoRoot
Set-WranglerPaths

$envMap = Get-KeyValueMap (Join-Path $repoRoot ".env")
$workerEnvMap = Get-KeyValueMap (Join-Path $repoRoot "worker\.dev.vars")

if (-not $env:CLOUDFLARE_API_TOKEN -and $envMap.ContainsKey("CLOUDFLARE_API_TOKEN")) {
  $env:CLOUDFLARE_API_TOKEN = $envMap["CLOUDFLARE_API_TOKEN"]
}

if (-not $env:CLOUDFLARE_API_TOKEN) {
  $whoamiOutput = & npx wrangler whoami 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Wrangler script mode needs CLOUDFLARE_API_TOKEN. Add it to .env or export it in the current shell."
  }
}

$databaseName = "tooth-harmony-pro-db"
$databaseId = Get-OrCreateDatabaseId $databaseName
Update-ConfigFile (Join-Path $repoRoot "wrangler.jsonc") $databaseId
Update-ConfigFile (Join-Path $repoRoot "worker\wrangler.toml") $databaseId

$jwtSecret = $envMap["JWT_SECRET"]
if (-not $jwtSecret) {
  $jwtSecret = $workerEnvMap["JWT_SECRET"]
}
if (-not $jwtSecret) {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $jwtSecret = [Convert]::ToBase64String($bytes)
}

$superuserEmail = $envMap["SUPERUSER_EMAIL"]
if (-not $superuserEmail) { $superuserEmail = $workerEnvMap["SUPERUSER_EMAIL"] }
if (-not $superuserEmail) { $superuserEmail = "superuser@clinic.local" }

$superuserPassword = $envMap["SUPERUSER_PASSWORD"]
if (-not $superuserPassword) { $superuserPassword = $workerEnvMap["SUPERUSER_PASSWORD"] }
if (-not $superuserPassword) { $superuserPassword = "ChangeMe123!" }

$superuserName = $envMap["SUPERUSER_NAME"]
if (-not $superuserName) { $superuserName = $workerEnvMap["SUPERUSER_NAME"] }
if (-not $superuserName) { $superuserName = "Clinic Superuser" }

Set-Secret "JWT_SECRET" $jwtSecret
Set-Secret "SUPERUSER_EMAIL" $superuserEmail
Set-Secret "SUPERUSER_PASSWORD" $superuserPassword
Set-Secret "SUPERUSER_NAME" $superuserName

npm run build
npx wrangler deploy
