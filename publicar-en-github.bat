@echo off
chcp 65001 >nul
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"
echo ============================================================================
echo   ACTUALIZANDO WEB 24/7 — NXMASTERS (https://nxmasters.github.io/)
echo ============================================================================
for /f "delims=" %%i in ('gh auth token') do set TOKEN=%%i
git add -A
git commit -m "Update NXMASTERS Catalog"
git push "https://x-access-token:%TOKEN%@github.com/NxMasters/nxmasters.github.io.git" main --force
echo.
echo [LISTO] Cambios publicados en https://nxmasters.github.io/
pause
