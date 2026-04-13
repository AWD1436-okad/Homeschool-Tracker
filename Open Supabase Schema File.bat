@echo off
setlocal

set "SQL_FILE=C:\Projects\Homeschool-Daily-Tracker\homeschool-daily-tracker\supabase\schema.sql"

if not exist "%SQL_FILE%" (
  echo The schema file could not be found.
  echo Expected location: %SQL_FILE%
  pause
  exit /b 1
)

start "" notepad.exe "%SQL_FILE%"
exit /b 0
