# ES modules require http:// — not file://
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "Seal Generator — open: http://127.0.0.1:8080" -ForegroundColor Cyan
Write-Host "Ctrl+C to stop."
python -m http.server 8080
