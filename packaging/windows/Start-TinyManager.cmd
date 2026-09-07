@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
start "TinyManager" /min powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SCRIPT_DIR%Start-TinyManager.ps1"
endlocal
