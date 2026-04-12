@echo off
:: ─────────────────────────────────────────────────────────────────────────────
::  ARIA Agent — Windows .EXE Build Script
::  Run this on Windows with Node.js 18+ installed.
::  Output: dist-electron\ARIA-Agent-Setup-1.0.0.exe  (NSIS installer)
::          dist-electron\ARIA-Agent-Portable-1.0.0.exe  (portable, no install)
:: ─────────────────────────────────────────────────────────────────────────────

setlocal EnableDelayedExpansion
title ARIA Agent — Building .EXE

echo.
echo  ╔══════════════════════════════════════╗
echo  ║  ARIA Agent — Build Windows .EXE    ║
echo  ╚══════════════════════════════════════╝
echo.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Download from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found: && node --version

:: Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found.
    pause
    exit /b 1
)

:: Step 1 — Install dependencies
echo.
echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 ( echo [ERROR] npm install failed. && pause && exit /b 1 )

:: Step 2 — Generate icons
echo.
echo [2/4] Generating app icons...
node assets\generate-icon.js
if errorlevel 1 ( echo [ERROR] Icon generation failed. && pause && exit /b 1 )

:: Step 3 — Build React app
echo.
echo [3/4] Building React app (Vite)...
call npm run build:renderer
if errorlevel 1 ( echo [ERROR] Vite build failed. && pause && exit /b 1 )

:: Step 4 — Build Electron .exe
echo.
echo [4/4] Building Windows .EXE with electron-builder...
call npx electron-builder --win --x64
if errorlevel 1 ( echo [ERROR] electron-builder failed. && pause && exit /b 1 )

:: Done
echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║  ✅ BUILD COMPLETE!                               ║
echo  ║                                                   ║
echo  ║  Installer:  dist-electron\ARIA-Agent-Setup*.exe ║
echo  ║  Portable:   dist-electron\ARIA-Agent-Portable*.exe ║
echo  ╚═══════════════════════════════════════════════════╝
echo.

:: Open output folder
explorer dist-electron

pause
