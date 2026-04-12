#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  ARIA Agent — Windows .EXE Build Script (Linux / macOS)
#  Cross-compiles a Windows .exe using wine + electron-builder.
#
#  On Linux:   requires wine, winehq-stable
#  On macOS:   no extra deps needed (electron-builder handles it natively)
#  On Windows: use build-exe.bat instead
# ─────────────────────────────────────────────────────────────────────────────

set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m';  BOLD='\033[1m';     NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║  ARIA Agent — Build Windows .EXE    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── Checks ────────────────────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
  echo -e "${RED}[ERROR] Node.js not found. Install from https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}[OK]${NC} Node.js $(node --version)"

if [[ "$(uname)" == "Linux" ]]; then
  if ! command -v wine &>/dev/null; then
    echo -e "${YELLOW}[WARN] wine not found. Installing...${NC}"
    echo "  sudo apt-get install -y wine winehq-stable"
    echo "  Or: sudo dnf install wine"
    echo ""
    echo -e "${YELLOW}  Proceeding anyway — electron-builder may skip wine for NSIS builds.${NC}"
  else
    echo -e "${GREEN}[OK]${NC} wine $(wine --version 2>/dev/null | head -1)"
  fi
fi

# ── Step 1: Dependencies ──────────────────────────────────────────────────────

echo -e "\n${CYAN}[1/4] Installing dependencies...${NC}"
npm install

# ── Step 2: Icons ─────────────────────────────────────────────────────────────

echo -e "\n${CYAN}[2/4] Generating app icons...${NC}"
node assets/generate-icon.js

# ── Step 3: Renderer build ────────────────────────────────────────────────────

echo -e "\n${CYAN}[3/4] Building React app (Vite)...${NC}"
npm run build:renderer

# ── Step 4: Electron .exe ─────────────────────────────────────────────────────

echo -e "\n${CYAN}[4/4] Building Windows .EXE...${NC}"

# Set wine environment for cross-compile if on Linux
if [[ "$(uname)" == "Linux" ]]; then
  export WINEPREFIX="$HOME/.wine-aria"
  export WINEARCH=win64
fi

npx electron-builder --win --x64

# ── Result ────────────────────────────────────────────────────────────────────

INSTALLER=$(find dist-electron -name "ARIA-Agent-Setup*.exe" 2>/dev/null | head -1)
PORTABLE=$(find  dist-electron -name "ARIA-Agent-Portable*.exe" 2>/dev/null | head -1)

echo -e "\n${GREEN}${BOLD}"
echo "  ╔═══════════════════════════════════════════════════╗"
echo "  ║  ✅ BUILD COMPLETE!                               ║"
echo "  ╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

if [[ -n "$INSTALLER" ]]; then
  SIZE=$(du -h "$INSTALLER" | cut -f1)
  echo -e "  ${GREEN}📦 Installer: ${BOLD}$INSTALLER${NC} ($SIZE)"
else
  echo -e "  ${YELLOW}⚠️  Installer not found — check dist-electron/${NC}"
fi

if [[ -n "$PORTABLE" ]]; then
  SIZE=$(du -h "$PORTABLE" | cut -f1)
  echo -e "  ${GREEN}⚡ Portable:  ${BOLD}$PORTABLE${NC} ($SIZE)"
fi

echo ""
echo -e "  ${CYAN}Copy the .exe to a Windows PC and run it to install ARIA.${NC}"
echo ""
