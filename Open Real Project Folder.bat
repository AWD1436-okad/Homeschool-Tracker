@echo off
setlocal

set "PROJECT_DIR=C:\Projects\Homeschool-Daily-Tracker\homeschool-daily-tracker"

if not exist "%PROJECT_DIR%\package.json" (
  echo The real project folder could not be found.
  echo Expected location: %PROJECT_DIR%
  pause
  exit /b 1
)

start "" explorer.exe "%PROJECT_DIR%"
exit /b 0
