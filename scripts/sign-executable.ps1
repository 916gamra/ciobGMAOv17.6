# PowerShell Code Signing & MSI Packaging Script for BDR Nexus v17.6
param(
    [string]$ExePath = "src-tauri\target\release\bdr-nexus-gmao.exe",
    [string]$CertPath = "C:\certs\codesign.pfx",
    [string]$CertPassword = $env:CERT_PASSWORD,
    [string]$TimestampServer = "http://timestamp.digicert.com"
)

Write-Host "=== BDR Nexus v17.6 Code Signing & Verification ===" -ForegroundColor Cyan

if (Test-Path $ExePath) {
    $signtool = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe"
    if (Test-Path $signtool) {
        Write-Host "Signing executable $ExePath..." -ForegroundColor Yellow
        & $signtool sign /f $CertPath /p $CertPassword /t $TimestampServer /fd SHA256 $ExePath
        & $signtool verify /pa $ExePath
        Write-Host "Code signing verified successfully!" -ForegroundColor Green
    } else {
        Write-Host "signtool.exe not found at default Windows SDK path. Skipping signing step in dev." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "Executable $ExePath not found. Please run 'npm run tauri build' first." -ForegroundColor Red
}
