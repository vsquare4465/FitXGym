param([Parameter(Mandatory=$true)][string]$BackupZip)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$backupPath = (Resolve-Path -LiteralPath $BackupZip).Path
$expectedZipHash = ((Get-Content -LiteralPath "$backupPath.sha256" -Raw).Trim() -split '\s+')[0]
$zipHasher = [System.Security.Cryptography.SHA256]::Create()
$zipStream = [System.IO.File]::OpenRead($backupPath)
try { $zipHash = ([BitConverter]::ToString($zipHasher.ComputeHash($zipStream))).Replace('-', '').ToLower() }
finally { $zipStream.Dispose(); $zipHasher.Dispose() }
if ($zipHash -ne $expectedZipHash) { throw 'ZIP checksum mismatch' }
$archive = [System.IO.Compression.ZipFile]::OpenRead($backupPath)
try {
  $entriesByName = @{}
  foreach ($entry in $archive.Entries) { $entriesByName[$entry.FullName.Replace('\', '/')] = $entry }
  $manifestEntry = @($archive.Entries | Where-Object { $_.FullName.Replace('\', '/') -match '^[^/]+/manifest.json$' })
  if ($manifestEntry.Count -ne 1) { throw 'Expected exactly one backup manifest' }
  $prefix = $manifestEntry[0].FullName.Replace('\', '/') -replace 'manifest.json$', ''
  $reader = New-Object System.IO.StreamReader($manifestEntry[0].Open())
  try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
  $verified = 0
  foreach ($item in $manifest.files.PSObject.Properties) {
    $entry = $entriesByName[$prefix + $item.Name]
    if ($null -eq $entry) { throw "Missing archive entry: $($item.Name)" }
    $stream = $entry.Open()
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try { $actual = ([BitConverter]::ToString($hasher.ComputeHash($stream))).Replace('-', '').ToLower() }
    finally { $stream.Dispose(); $hasher.Dispose() }
    if ($actual -ne $item.Value) { throw "File checksum mismatch: $($item.Name)" }
    $verified++
  }
  Write-Output "Verified ZIP checksum and all $verified archived file hashes. Media files: $($manifest.mediaCount)."
} finally { $archive.Dispose() }
