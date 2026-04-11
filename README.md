# ARIA — Autonomous Resident Intelligence Agent

**ARIA** is an AI-powered virtual executive assistant — available as an **Android APK** and a desktop Electron app.

> **AI Engine:** Google Gemini 1.5 Flash (free tier, no credit card required)

---

## Android APK — Quick Build

### Prerequisites
- Node.js 18+
- Android Studio (with Android SDK 34+)
- Java 17+

### 1-command build

```bash
npm install
bash build-apk.sh
```

The APK will be at `dist-apk/ARIA-Agent.apk`.

### Install on your Android device

```bash
adb install dist-apk/ARIA-Agent.apk
```

Or copy the `.apk` file to the phone and open it (enable "Install from unknown sources" in Settings → Security).

### Step-by-step (manual)

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build:renderer       # → outputs to dist/

# 3. Add Android platform (first time only)
npx cap add android

# 4. Sync assets to Android
npx cap sync android

# 5a. Open Android Studio and build from there
npx cap open android
# Build → Build Bundle(s)/APK(s) → Build APK(s)

# 5b. OR build from command line (requires Android SDK in PATH)
cd android && ./gradlew assembleDebug
```

---

## Desktop App (Electron)

```bash
npm install
cp .env.example .env
npm run dev          # Dev mode (Vite + Electron)
npm run build        # Build distributable
```

---

## AI Engine — Gemini 1.5 Flash

| | |
|---|---|
| **Model** | `gemini-1.5-flash` |
| **Free tier** | 15 req/min · 1M tokens/day |
| **API Key** | Embedded in the app |
| **Key source** | [aistudio.google.com](https://aistudio.google.com) |

To use your own key, update `GEMINI_API_KEY` in `src/services/gemini.js`.

---

## Features

| Panel | Mobile | Desktop |
|---|---|---|
| **Chat ARIA** (Gemini AI) | ✅ | ✅ |
| **Dashboard** | ✅ | ✅ |
| **Email** | UI only | ✅ (IMAP/SMTP) |
| **Calendar** | UI only | ✅ (Google/Outlook) |
| **Files** | UI only | ✅ (filesystem) |
| **Financial** | ✅ (local) | ✅ (local + APIs) |
| **System Monitor** | ✅ | ✅ |
| **Audit Logs** | ✅ | ✅ |
| **Settings** | ✅ | ✅ |

---

## Project Structure

```
aria-agent/
├── src/
│   ├── main/          # Electron main process
│   ├── renderer/      # React UI (Vite + Tailwind)
│   │   └── components/
│   │       ├── layout/   # Sidebar, Header, MobileHeader, BottomNav
│   │       └── panels/   # Dashboard, Chat, Email, Calendar, ...
│   ├── services/
│   │   └── gemini.js  # ← Gemini API (browser/Android)
│   ├── core/          # Agent, Logger, Scheduler, Store, Permissions
│   ├── modules/       # Email, Files, Financial, System (Node.js)
│   └── utils/         # Crypto, Formatters, Validators
├── capacitor.config.json  # ← Android APK config
├── build-apk.sh           # ← One-command APK build
└── package.json
```

---

## Permission Levels

| Level | Requires | Examples |
|---|---|---|
| 1 — Free | Auto-execute | Read, search, reports |
| 2 — Quick Confirm | 30s delay | Auto-reply, move to trash |
| 3 — Explicit | User approval | Send email, delete files |
| 4 — PIN | Approval + PIN | **Payments, credentials** |

---

*ARIA v1.0 · Gemini 1.5 Flash · Android + Desktop*
