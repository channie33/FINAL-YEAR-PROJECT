<#
run.ps1 - helper to start the backend using the project's venv

Usage:
  .\run.ps1 -Port 8000

This script opens a new PowerShell window, sets `PORT` for the backend,
and starts `Backend\app.py` using the venv Python.
#>

param(
    [int]$Port = 8000,
    [switch]$Inline
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectRoot

$venvPython = Join-Path $ProjectRoot 'venv\Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    Write-Error "venv Python not found at $venvPython. Create the venv first: python -m venv venv"
    exit 1
}

$backendDir = Join-Path $ProjectRoot 'Backend'
if (-not (Test-Path $backendDir)) {
    Write-Error "Backend folder not found at $backendDir"
    exit 1
}

if ($Inline) {
    Write-Host "Starting backend inline from $backendDir on port $Port..."
    $env:PORT = $Port
    Set-Location -Path $backendDir
    & $venvPython 'app.py'
} else {
    Write-Host "Starting backend in new window from $backendDir on port $Port..."
    $cmd = "$env:PORT=$Port; Set-Location -Path '$backendDir'; & '$venvPython' 'app.py'"
    Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command',$cmd -WindowStyle Normal
    Write-Host "Backend launched (new window). Visit http://localhost:$Port"
}
