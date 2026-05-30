# One-command Playwright runner for the Forever stack.
#
# Usage:  pwsh ./test-e2e.ps1               # full suite
#         pwsh ./test-e2e.ps1 auth.spec.ts  # one spec
#         pwsh ./test-e2e.ps1 --project=chromium-desktop --grep "sign in"
#
# Confirms the dev stack is up (auto-recovers a stale D: mount once if needed),
# runs the Playwright container, then opens the HTML report on success or
# failure. Exits with the test exit code.

$ErrorActionPreference = 'Stop'

# --- 1. Ensure the dev stack is up ----------------------------------------------
function Test-StackReady {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8000/auth/v1/settings" `
            -Headers @{ apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYWx0aW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDU0NTAsImV4cCI6MjA5NTIwNTQ1MH0.vQfnuMlaDDvRkozVTaFaQn7UNgNIcYH9moXxK-KpNAM" } `
            -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
        return $r.StatusCode -eq 200
    } catch { return $false }
}

if (-not (Test-StackReady)) {
    Write-Host "==> Dev stack not responding; bringing it up (via dev-up.ps1)" -ForegroundColor Yellow
    & pwsh ./dev-up.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Stack failed to come up. Aborting." -ForegroundColor Red
        exit 1
    }
}

# --- 2. Run the test container ---------------------------------------------------
$reportDir = Join-Path $PSScriptRoot 'playwright-report'
if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Path $reportDir | Out-Null }

Write-Host "==> Running Playwright suite" -ForegroundColor Cyan
$composeArgs = @('compose', '-f', 'docker-compose.test.yml', '--env-file', '.env.docker',
                 'run', '--rm', 'playwright')
if ($args.Count -gt 0) {
    # Forward any args as the playwright test invocation
    $composeArgs += @('npx', 'playwright', 'test') + $args
}
docker @composeArgs
$rc = $LASTEXITCODE

# --- 3. Summarize + open report --------------------------------------------------
$summary = Join-Path $reportDir 'SUMMARY.md'
if (Test-Path $summary) {
    Write-Host ""
    Write-Host "===== SUMMARY ($summary) ====="  -ForegroundColor Cyan
    Get-Content $summary | Select-Object -First 30
    Write-Host "..."
    Write-Host ""
}

if (Test-Path (Join-Path $reportDir 'index.html')) {
    Write-Host "Full report: $reportDir\index.html"
    if ($env:OPEN_REPORT -ne '0') {
        try { Start-Process (Join-Path $reportDir 'index.html') } catch {}
    }
}

exit $rc
