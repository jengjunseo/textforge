@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4291 -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  start "TextForge Local Server" /min node dev-server.js
  timeout /t 1 /nobreak >nul
)

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME_X86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if exist "%EDGE%" (
  start "" "%EDGE%" --app=http://127.0.0.1:4291
  exit /b 0
)

if exist "%CHROME%" (
  start "" "%CHROME%" --app=http://127.0.0.1:4291
  exit /b 0
)

if exist "%CHROME_X86%" (
  start "" "%CHROME_X86%" --app=http://127.0.0.1:4291
  exit /b 0
)

start "" "http://127.0.0.1:4291"
endlocal
