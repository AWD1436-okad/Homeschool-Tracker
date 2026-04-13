@echo off
setlocal

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  taskkill /PID %%P /F >nul 2>nul
)

echo Homeschool Daily Tracker has been stopped.
timeout /t 2 /nobreak >nul
exit /b 0
