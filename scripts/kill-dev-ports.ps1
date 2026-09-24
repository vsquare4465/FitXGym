# Stop Node processes listening on Fit X Gym dev ports (Windows)
$ports = 3000..3017
$killed = @()

foreach ($port in $ports) {
  $matches = netstat -ano | Select-String "LISTENING" | Select-String ":$port\s"
  foreach ($line in $matches) {
    $processId = ($line.ToString().Trim() -split '\s+')[-1]
    if ($processId -match '^\d+$' -and $processId -ne '0' -and $killed -notcontains $processId) {
      Write-Host "Stopping PID $processId (port $port)..."
      Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
      $killed += $processId
    }
  }
}

if ($killed.Count -eq 0) {
  Write-Host "No processes found on ports 3000-3017."
} else {
  Write-Host "Done. Stopped $($killed.Count) process(es). Run: npm run dev"
}
