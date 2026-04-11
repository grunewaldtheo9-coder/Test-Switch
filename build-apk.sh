#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  ARIA Agent — Android APK Build Script
#  Prerequisites: Node.js 18+, Android Studio, Java 17+, Android SDK
# ─────────────────────────────────────────────────────────────────────────────

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════╗"
echo "  ║  ARIA Agent — Build Android APK  ║"
echo "  ╚══════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: Install dependencies ──────────────────────────────────────────────
echo -e "${CYAN}[1/5] Installing dependencies...${NC}"
npm install

# ── Step 2: Build the web app ─────────────────────────────────────────────────
echo -e "${CYAN}[2/5] Building React app (Vite)...${NC}"
npm run build:renderer

# ── Step 3: Init Capacitor (first time only) ──────────────────────────────────
if [ ! -f "android/build.gradle" ]; then
  echo -e "${CYAN}[3/5] Initializing Capacitor Android platform...${NC}"
  npx cap add android
else
  echo -e "${GREEN}[3/5] Android platform already initialized. Skipping.${NC}"
fi

# ── Step 4: Sync Capacitor ─────────────────────────────────────────────────────
echo -e "${CYAN}[4/5] Syncing web assets to Android...${NC}"
npx cap sync android

# ── Step 5: Build APK ──────────────────────────────────────────────────────────
echo -e "${CYAN}[5/5] Building APK...${NC}"
cd android
./gradlew assembleDebug
cd ..

# Find the output APK
APK_PATH=$(find android/app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)

if [ -n "$APK_PATH" ]; then
  mkdir -p dist-apk
  cp "$APK_PATH" "dist-apk/ARIA-Agent.apk"
  echo -e "${GREEN}"
  echo "  ✅ APK gerado com sucesso!"
  echo "  📦 Arquivo: dist-apk/ARIA-Agent.apk"
  echo -e "${NC}"
else
  echo -e "${YELLOW}"
  echo "  ⚠️  APK não encontrado automaticamente."
  echo "  → Abra o Android Studio: npx cap open android"
  echo "  → Build → Build Bundle(s)/APK(s) → Build APK(s)"
  echo -e "${NC}"
fi

echo -e "${CYAN}Para instalar no celular:${NC}"
echo "  adb install dist-apk/ARIA-Agent.apk"
echo ""
echo -e "${CYAN}Para abrir no Android Studio:${NC}"
echo "  npx cap open android"
