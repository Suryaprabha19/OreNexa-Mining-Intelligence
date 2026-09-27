@echo off
cd /d "%~dp0frontend"
echo Syncing frontend dependencies...
call npm install
npm run dev
pause
