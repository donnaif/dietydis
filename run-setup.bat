@echo off
rem DietyDis setup. Usage: run-setup.bat [-Package] [-NoStart]
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-dietydis.ps1" %*
if errorlevel 1 (
    echo.
    echo Setup failed. See the error above.
    pause
    exit /b 1
)
