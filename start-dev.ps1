[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$FrontendPort = 3000,

  [ValidateRange(1, 65535)]
  [int]$BackendPort = 4000
)

$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$frontendPath = Join-Path $root 'learning-platform-frontend'
$backendPath = Join-Path $root 'learning-platform-backend'

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm was not found. Install Node.js, then run this script again.'
}

foreach ($projectPath in @($frontendPath, $backendPath)) {
  if (-not (Test-Path (Join-Path $projectPath 'package.json'))) {
    throw "Expected package.json was not found in: $projectPath"
  }
}

function Convert-ToPowerShellLiteral([string]$value) {
  return $value.Replace("'", "''")
}

$safeFrontendPath = Convert-ToPowerShellLiteral $frontendPath
$safeBackendPath = Convert-ToPowerShellLiteral $backendPath

$backendCommand = "Set-Location -LiteralPath '$safeBackendPath'; `$env:PORT = '$BackendPort'; npm run start:dev"
$frontendCommand = "Set-Location -LiteralPath '$safeFrontendPath'; npm run dev -- --port $FrontendPort"

$backend = Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
  '-NoExit',
  '-ExecutionPolicy', 'Bypass',
  '-Command', $backendCommand
) -PassThru

$frontend = Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
  '-NoExit',
  '-ExecutionPolicy', 'Bypass',
  '-Command', $frontendCommand
) -PassThru

Write-Host ''
Write-Host 'JEE AI development servers started.' -ForegroundColor Green
Write-Host "Frontend: http://localhost:$FrontendPort (process $($frontend.Id))"
Write-Host "Backend:  http://localhost:$BackendPort (process $($backend.Id))"
Write-Host 'Use Stop-Process with the displayed process IDs to stop the servers.' -ForegroundColor Yellow
