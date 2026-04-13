@echo off
setlocal

set "ENV_FILE=C:\Projects\Homeschool-Daily-Tracker\homeschool-daily-tracker\.env.local"

if not exist "%ENV_FILE%" (
  echo The env file could not be found.
  echo Expected location: %ENV_FILE%
  pause
  exit /b 1
)

start "" notepad.exe "%ENV_FILE%"
exit /b 0
