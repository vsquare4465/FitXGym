@echo off
cd /d "%~dp0"
node scripts/backup-cloudflare.mjs
echo.
pause
