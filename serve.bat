@echo off
REM ES modules (app.js) do not load from file:// — use HTTP.
cd /d "%~dp0"
echo.
echo Seal Generator — open:
echo    http://127.0.0.1:8080
echo.
echo Press Ctrl+C to stop.
echo.
python -m http.server 8080
