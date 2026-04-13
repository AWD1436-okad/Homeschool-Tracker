@echo off
setlocal

set "APP_DIR=C:\Projects\Homeschool-Daily-Tracker\homeschool-daily-tracker"
set "APP_URL=http://127.0.0.1:3000"

if not exist "%APP_DIR%\package.json" (
  echo The app folder could not be found.
  echo Expected location: %APP_DIR%
  echo.
  echo Please tell Codex that the launcher could not find the project.
  pause
  exit /b 1
)

echo Starting Homeschool Daily Tracker...
echo Please wait while the app gets ready.
echo A black window will stay open while you use the app.
echo.

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  taskkill /PID %%P /F >nul 2>nul
)

start "Homeschool Daily Tracker Server" cmd /k "cd /d ""%APP_DIR%"" && npm.cmd run dev"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(30); do { Start-Sleep -Seconds 1; try { $r=Invoke-WebRequest -UseBasicParsing '%APP_URL%'; if($r.StatusCode -eq 200){ exit 0 } } catch {} } while((Get-Date) -lt $deadline); exit 1"

if errorlevel 1 (
  echo The app took too long to start.
  echo Please wait a little longer, then open:
  echo %APP_URL%
  pause
  exit /b 1
)

start "" "%APP_URL%"

exit /b 0
