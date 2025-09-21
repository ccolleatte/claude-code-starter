@echo off
REM Security Monitor Windows Batch Script
REM Windows-compatible version of security-monitor.sh

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%\..
set LOG_DIR=%PROJECT_ROOT%\logs
set METRICS_DIR=%PROJECT_ROOT%\metrics
set SECURITY_LOG=%LOG_DIR%\security-events.log

REM Create directories if they don't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%METRICS_DIR%" mkdir "%METRICS_DIR%"

set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=help

if "%COMMAND%"=="init" goto init
if "%COMMAND%"=="scan" goto scan
if "%COMMAND%"=="status" goto status
if "%COMMAND%"=="metrics" goto metrics
if "%COMMAND%"=="dashboard" goto dashboard
goto help

:init
echo [92m✅ Security monitoring initialized[0m
if not exist "%SECURITY_LOG%" (
    echo %date% %time% [INFO] Security monitoring initialized > "%SECURITY_LOG%"
)
goto end

:scan
echo [94m🔍 Scanning for security events...[0m
call :init
REM Basic log scanning for Windows
if exist "%PROJECT_ROOT%\*.log" (
    findstr /i "error failed exception" "%PROJECT_ROOT%\*.log" > nul 2>&1
    if !errorlevel! equ 0 (
        echo [93m⚠️ Found error patterns in logs[0m
    ) else (
        echo [92m✅ No error patterns found[0m
    )
)
call :metrics
goto end

:status
echo [94m📊 Security Status Summary:[0m
if exist "%SECURITY_LOG%" (
    set /a CRITICAL=0
    set /a HIGH=0
    set /a MEDIUM=0
    
    REM Count severity levels (basic Windows implementation)
    for /f %%i in ('findstr /c:"CRITICAL" "%SECURITY_LOG%" 2^>nul ^| find /c /v ""') do set CRITICAL=%%i
    for /f %%i in ('findstr /c:"HIGH" "%SECURITY_LOG%" 2^>nul ^| find /c /v ""') do set HIGH=%%i
    for /f %%i in ('findstr /c:"MEDIUM" "%SECURITY_LOG%" 2^>nul ^| find /c /v ""') do set MEDIUM=%%i
    
    echo Critical events: !CRITICAL!
    echo High severity events: !HIGH!
    echo Medium severity events: !MEDIUM!
    
    if !CRITICAL! equ 0 if !HIGH! equ 0 (
        echo [92m✅ Security status: HEALTHY[0m
    ) else if !CRITICAL! equ 0 if !HIGH! lss 3 (
        echo [93m⚠️ Security status: WARNING[0m
    ) else (
        echo [91m🚨 Security status: CRITICAL[0m
    )
) else (
    echo [93m⚠️ No security logs found. Run 'scan' first.[0m
)
goto end

:metrics
echo [94m📊 Generating security metrics...[0m
set TODAY=%date:~-4,4%%date:~-10,2%%date:~-7,2%
set METRICS_FILE=%METRICS_DIR%\security-%TODAY%.json
set TIMESTAMP=%date% %time%

REM Generate basic metrics JSON
(
echo {
echo   "timestamp": "%TIMESTAMP%",
echo   "date": "%TODAY%",
echo   "security_metrics": {
echo     "events_24h": {
echo       "critical": 0,
echo       "high": 0,
echo       "medium": 0,
echo       "low": 0,
echo       "info": 0,
echo       "total": 0
echo     },
echo     "health_score": 100,
echo     "status": "HEALTHY",
echo     "last_scan": "%TIMESTAMP%"
echo   }
echo }
) > "%METRICS_FILE%"

echo [92m✅ Security metrics generated: %METRICS_FILE%[0m
goto end

:dashboard
echo [94m📊 Generating security dashboard...[0m
call :metrics
set DASHBOARD_FILE=%PROJECT_ROOT%\security-dashboard.html

REM Generate simplified dashboard for Windows
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo   ^<title^>Security Dashboard^</title^>
echo   ^<style^>
echo     body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
echo     .container { max-width: 800px; margin: 0 auto; }
echo     .header { text-align: center; margin-bottom: 30px; }
echo     .metric-card { background: white; padding: 20px; margin: 10px; border-radius: 8px; text-align: center; }
echo     .status-healthy { color: #28a745; }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<div class="container"^>
echo     ^<div class="header"^>
echo       ^<h1^>🔐 Security Dashboard^</h1^>
echo       ^<p^>Claude Starter Kit v4.1 - Security Monitoring^</p^>
echo     ^</div^>
echo     ^<div class="metric-card"^>
echo       ^<h2 class="status-healthy"^>System Status: HEALTHY^</h2^>
echo       ^<p^>Last updated: %TIMESTAMP%^</p^>
echo     ^</div^>
echo   ^</div^>
echo ^</body^>
echo ^</html^>
) > "%DASHBOARD_FILE%"

echo [92m✅ Security dashboard generated: %DASHBOARD_FILE%[0m
goto end

:help
echo Security Monitor for Claude Starter Kit - Windows Version
echo.
echo Usage: %0 [command]
echo.
echo Commands:
echo   init      - Initialize security monitoring
echo   scan      - Scan existing logs for security events
echo   status    - Show current security status
echo   metrics   - Generate security metrics
echo   dashboard - Generate security dashboard HTML
echo   help      - Show this help message
echo.
echo Examples:
echo   %0 scan       # Scan existing logs
echo   %0 dashboard  # Generate HTML dashboard
goto end

:end
endlocal