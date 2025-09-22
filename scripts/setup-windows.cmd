@echo off
REM Setup Windows - Claude Code Starter Kit
REM =========================================

echo Setup Claude Code Starter Kit - Windows
echo ========================================

REM Verification Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js requis. Installer Node.js >= 16.0.0
    pause
    exit /b 1
)

echo OK Node.js detecte: 
node --version

REM Creer .env depuis template
if not exist .env (
    if exist .env.template (
        copy .env.template .env >nul
        echo OK Fichier .env cree depuis template
    ) else (
        echo ERREUR: Fichier .env.template manquant
        pause
        exit /b 1
    )
) else (
    echo OK Fichier .env existe deja
)

REM Verification configuration MCP
if not exist .claude\mcp.json (
    echo ERREUR: Configuration MCP manquante (.claude\mcp.json)
    pause
    exit /b 1
) else (
    echo OK Configuration MCP presente
)

echo.
echo Verification environnement...
npm run check:env

echo.
echo Setup termine !
echo Etapes suivantes :
echo    1. Editez .env avec vos vraies cles API
echo    2. Lancez: npm run test:autonomy
echo    3. Testez: npm test

pause