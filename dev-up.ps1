# Robust dev startup for the Forever stack on Windows + Docker Desktop (WSL2).
#
# Use THIS instead of `docker compose restart`. The `restart` command cannot
# recreate the host bind mount when Docker Desktop's WSL backend leaves the
# D: drive share stale (the recurring
#   "mkdir /run/desktop/mnt/host/d: file exists"
# error). `up -d` recreates it; and if even that fails, this script restarts
# the WSL backend once and retries.
#
# Usage:  pwsh ./dev-up.ps1     (from the project root)

$ErrorActionPreference = 'Stop'
$compose = @('compose', '--env-file', '.env.docker', 'up', '-d')

function Invoke-ComposeUp {
    $out = & docker @compose 2>&1 | Out-String
    Write-Host $out
    return $LASTEXITCODE -eq 0 -and ($out -notmatch 'mkdir /run/desktop/mnt/host')
}

Write-Host "==> docker compose up -d"
if (Invoke-ComposeUp) {
    Write-Host "`nStack is up."
} else {
    Write-Host "`n!! Stale WSL mount detected. Restarting the WSL backend and retrying..." -ForegroundColor Yellow
    wsl --shutdown
    Write-Host "   Waiting for the Docker engine to come back..."
    do { Start-Sleep -Seconds 3 } until (docker info 2>$null)
    if (Invoke-ComposeUp) { Write-Host "`nStack is up (after WSL restart)." }
    else { Write-Host "`nStill failing — quit & reopen Docker Desktop, then rerun this script." -ForegroundColor Red; exit 1 }
}

# Kong starts before its upstreams are ready on a cold boot; a quick restart
# avoids the transient ERR_EMPTY_RESPONSE on :8000.
Write-Host "==> restarting kong to settle upstreams"
docker compose --env-file .env.docker restart kong | Out-Null
Write-Host "Done. App: http://localhost:3000   Kong: http://localhost:8000"
