# Creates fitx user + fitxgym database for local PostgreSQL (Windows).
# Uses the postgres superuser password you set during PostgreSQL install.

$ErrorActionPreference = "Stop"

$psql = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
  Where-Object { $_.Directory.Parent.Name -match '^\d+$' } |
  Sort-Object { [int]$_.Directory.Parent.Name } -Descending |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $psql) {
  Write-Error "psql.exe not found. Install PostgreSQL server (not only ODBC drivers)."
}

$sqlFile = Join-Path $PSScriptRoot "setup-local-db.sql"

Write-Host ""
Write-Host "FitX Gym - local PostgreSQL setup" -ForegroundColor Cyan
Write-Host "Using: $psql" -ForegroundColor DarkGray
Write-Host "This creates user fitx and database fitxgym (matches .env)." -ForegroundColor DarkGray
Write-Host ""

$secure = Read-Host "Enter your PostgreSQL postgres user password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$env:PGPASSWORD = $plain
try {
  & $psql -U postgres -h localhost -f $sqlFile
  if ($LASTEXITCODE -ne 0) {
    throw "psql exited with code $LASTEXITCODE"
  }
  Write-Host ""
  Write-Host "Database user and database created." -ForegroundColor Green
  Write-Host 'Next: npm run db:setup' -ForegroundColor Green
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
