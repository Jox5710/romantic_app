# Generate matching ANON_KEY and SERVICE_ROLE_KEY for Supabase self-hosting.
# Both are HS256 JWTs signed with $JwtSecret. Re-run whenever JWT_SECRET changes.
#
# Usage:
#   .\supabase\keygen.ps1 -JwtSecret "your-secret-here"
#   .\supabase\keygen.ps1            # uses the .env.docker default

param(
    [string]$JwtSecret = "your-super-secret-jwt-token-with-at-least-32-characters",
    [int]$ExpYears = 10
)

function b64u([byte[]]$bytes) {
    [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function New-Jwt([string]$role, [string]$secret, [int]$years) {
    $now = [int][double]::Parse((Get-Date -UFormat %s))
    $exp = $now + ($years * 365 * 24 * 3600)

    $header  = '{"alg":"HS256","typ":"JWT"}'
    $payload = "{`"iss`":`"supabase`",`"ref`":`"realtime`",`"role`":`"$role`",`"iat`":$now,`"exp`":$exp}"

    $h = b64u ([Text.Encoding]::UTF8.GetBytes($header))
    $p = b64u ([Text.Encoding]::UTF8.GetBytes($payload))

    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
    $s = b64u ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$h.$p")))

    "$h.$p.$s"
}

Write-Host "JWT_SECRET=$JwtSecret"
Write-Host "ANON_KEY=$(New-Jwt -role 'anon'         -secret $JwtSecret -years $ExpYears)"
Write-Host "SERVICE_ROLE_KEY=$(New-Jwt -role 'service_role' -secret $JwtSecret -years $ExpYears)"
