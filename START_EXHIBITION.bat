@echo off
title UTM Gesture Quest V3.0 - Exhibition Launcher
echo ========================================================
echo   UTM GESTURE QUEST V3.0 - EXHIBITION LAUNCHER
echo   Universiti Teknologi Malaysia (UTM)
echo   Ziarah Kasih dan Cakna Komuniti - 10 Nov 2026
echo ========================================================
echo.
echo [1/2] Verifying offline assets and production build...
if not exist "dist\index.html" (
    echo Building production package...
    call npm run build
)
echo.
echo [2/2] Launching offline exhibition server at http://localhost:5173 ...
echo.
start http://localhost:5173
npm run preview -- --port 5173 --host

