# Uploads selected keys from .env to the fitx-gym Worker. Does not print values.
$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) {
  Write-Error ".env was not found. Run wrangler secret put for each key in GO-LIVE.md."
}

$wanted = @(
  "JWT_SECRET",
  "AUTH_PEPPER",
  "PUBLIC_SITE_URL",
  "ALLOWED_ORIGINS",
  "SMTP_PASS",
  "MAIL_PASSWORD",
  "RESEND_API_KEY",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "CALLMEBOT_APIKEY",
  "FAST2SMS_API_KEY"
)

$values = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $eq = $line.IndexOf("=")
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  $values[$key] = $value
}

$pushed = @()
foreach ($key in $wanted) {
  $value = $values[$key]
  if (-not $value) { continue }
  $value | npx wrangler secret put $key
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $pushed += $key
}

if ($pushed.Count -eq 0) {
  Write-Error "None of the Cloudflare secret keys were set in .env."
}

Write-Output ("Uploaded: " + ($pushed -join ", "))
