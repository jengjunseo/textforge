@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-textforge-shortcut.ps1"
echo.
echo TextForge shortcut created on your desktop.
echo Right-click the shortcut and choose "Pin to taskbar".
pause
endlocal
