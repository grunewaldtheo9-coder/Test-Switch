# 🟥 CubeLauncher

A modern, open-source Minecraft launcher built with **Electron**, **React 18**, **TypeScript**, and **Zustand**. Features full mod management, multi-profile support, and Microsoft authentication.

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Electron](https://img.shields.io/badge/Electron-28%2B-47848F)
![React](https://img.shields.io/badge/React-18%2B-61DAFB)

## ✨ Features

### Authentication
- **Microsoft OAuth2** — Full device-code flow: Microsoft → Xbox Live → XSTS → Minecraft token exchange
- **Offline Mode** — Play without an account using deterministic offline UUIDs
- **Secure token storage** — Tokens encrypted via Electron `safeStorage` (OS keychain)
- **Multi-account support** — Add, switch, and manage multiple accounts
- **Automatic token refresh** — Transparent re-authentication before expiry

### Version Management
- **Official manifest** — Fetches all versions from Mojang's `version_manifest_v2.json`
- **Filtered browsing** — Toggle Releases, Snapshots, Old Beta, Old Alpha with real-time search
- **One-click install** — Downloads client JAR, libraries, and assets with SHA-1 verification
- **Parallel downloads** — Up to 8 simultaneous connections with resume support
- **Modloader support** — Install Fabric, Quilt, and Forge alongside vanilla

### Mod Management
- **Modrinth integration** — Search, browse, and install mods from Modrinth
- **CurseForge integration** — Optional CurseForge API support (requires API key)
- **Per-profile mods** — Each profile has isolated mod folders
- **Enable/disable toggle** — Toggle mods without deleting them (`.disabled` extension)
- **Cached search results** — 60-second in-memory cache reduces API calls

### Profile System
- **Isolated instances** — Each profile gets its own mods/, config/, saves/, resourcepacks/
- **Profile wizard** — Choose name, Minecraft version, modloader, and memory allocation
- **Duplicate profiles** — Clone a profile with all its mods in one click
- **Play time tracking** — Total hours, launch count, and crash frequency per profile
- **Quick launch** — Double-click to launch directly from the dashboard

### Game Launching
- **Correct launch spec** — Builds classpath, main class, and arguments per Mojang's format
- **Live console** — Real-time game output with level filtering (INFO/WARN/ERROR/DEBUG)
- **Multi-instance** — Run multiple Minecraft instances simultaneously
- **Java auto-detection** — Scans common install paths on Windows, macOS, and Linux
- **Kill button** — Force-terminate unresponsive game processes

### UI & Design
- **Dark Minecraft theme** — Custom palette with pixel-art inspired accents
- **Frameless window** — Custom title bar with platform-native window controls
- **Collapsible sidebar** — Six sections: Home, Profiles, Versions, Mods, Console, Settings
- **Toast notifications** — Auto-dismissing notifications for downloads, installs, and errors
- **Skeleton loaders** — Shimmer placeholders while content loads
- **Custom scrollbars** — Styled to match the dark theme
- **Responsive layout** — Minimum 900×600, adapts gracefully on resize

### Settings
- **5 settings tabs** — General, Java, Downloads, Appearance, Advanced
- **7 languages** — English, Portuguese, Spanish, French, German, Japanese, Chinese
- **Accent color picker** — Custom hex color applied in real-time via CSS variables
- **JVM argument presets** — Optimized G1GC flags for Minecraft
- **Java scanner** — Detect installed JDKs/JREs on the system
- **Download controls** — Parallel connections (1–8), speed limit, custom install directory

## 🏗 Architecture

```
cubelauncher/
├── electron/                  # Electron main process
│   ├── main.ts               # App entry, window creation, IPC wiring
│   ├── preload.ts            # Secure IPC bridge (window.cube)
│   ├── types.ts              # Shared TypeScript types
│   ├── ipc/
│   │   └── handlers.ts       # All IPC route registrations
│   └── services/
│       ├── auth/
│       │   ├── MicrosoftAuth.ts   # OAuth2 + Xbox + XSTS + MC chain
│       │   └── AuthService.ts     # Account management + token store
│       ├── versions/
│       │   └── VersionService.ts  # Manifest, install, libraries, assets
│       ├── profiles/
│       │   └── ProfileService.ts  # CRUD, duplication, play tracking
│       ├── mods/
│       │   └── ModService.ts      # Modrinth/CurseForge search & install
│       ├── launch/
│       │   └── LaunchService.ts   # Java spawn, classpath, log capture
│       ├── downloads/
│       │   └── DownloadManager.ts # Parallel downloads, SHA-1, resume
│       └── store/
│           └── ConfigStore.ts     # JSON config with atomic writes
├── src/                       # React renderer
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component with routing
│   ├── index.css             # Global styles + dark theme
│   ├── types/                # Type re-exports + window.cube declaration
│   ├── store/                # Zustand stores
│   │   ├── useAccountStore.ts
│   │   ├── useProfileStore.ts
│   │   ├── useVersionStore.ts
│   │   ├── useSettingsStore.ts
│   │   ├── useLaunchStore.ts
│   │   └── useToastStore.ts
│   ├── components/
│   │   ├── TitleBar.tsx
│   │   ├── Sidebar.tsx
│   │   └── ToastHost.tsx
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── ProfilesPage.tsx
│       ├── VersionsPage.tsx
│       ├── ModsPage.tsx
│       ├── ConsolePage.tsx
│       └── SettingsPage.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### Security Model

- **Context isolation** — The renderer has zero access to Node.js APIs
- **Preload bridge** — All IPC goes through `window.cube`, a typed API surface
- **No `nodeIntegration`** — Disabled; sandbox mode for the renderer
- **Atomic config writes** — Write-to-temp + rename prevents corruption on crash
- **Encrypted tokens** — `safeStorage` uses the OS keychain (Keychain on macOS, DPAPI on Windows, libsecret on Linux)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Java** 8+ (for launching Minecraft)

### Development

```bash
# Install dependencies
npm install

# Start dev server (Vite + Electron with hot reload)
npm run dev

# Type-check
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

### Building

```bash
# Build for current platform
npm run build

# Build without packaging (for testing)
npm run build:dir
```

Output goes to `release/` as platform installers:
- **Windows**: `.exe` (NSIS) and `.msi`
- **macOS**: `.dmg`
- **Linux**: `.AppImage` and `.deb`

## 🔧 Configuration

CubeLauncher stores its config at:
- **Windows**: `%APPDATA%/cubelauncher/cubelauncher.json`
- **macOS**: `~/Library/Application Support/cubelauncher/cubelauncher.json`
- **Linux**: `~/.config/cubelauncher/cubelauncher.json`

### Environment Variables

| Variable | Description |
|---|---|
| `CURSEFORGE_API_KEY` | CurseForge Core API key for mod browsing |

## 📝 License

MIT — see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes with clear messages
4. Push and open a Pull Request

Please run `npm run lint` and `npm run typecheck` before submitting.
