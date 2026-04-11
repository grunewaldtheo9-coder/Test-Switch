# ARIA — Autonomous Resident Intelligence Agent

**ARIA** is a full-featured virtual executive assistant desktop application built with Electron + React + Claude API.

## Features

| Module | Capabilities |
|---|---|
| **Dashboard** | System resources, activity feed, quick stats |
| **Chat** | Natural-language interface powered by Claude |
| **Email** | Read, compose, reply, organize (IMAP/SMTP) |
| **Calendar** | Monthly view, event management, reminders |
| **Files** | Browser, auto-organizer by type |
| **Financial** | Bills, transactions, charts, alerts |
| **System** | CPU/RAM/Disk/Temp monitoring, top processes |
| **Logs** | Full audit trail of every ARIA action |
| **Settings** | Profile, API keys, routines, security |

## Stack

- **Runtime:** Electron 31
- **Frontend:** React 18 + Tailwind CSS + Recharts + Lucide
- **Build:** Vite 5
- **AI:** Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk`
- **Storage:** `electron-store` + SQLite (local, encrypted)
- **Scheduler:** `node-cron`

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in your API keys
cp .env.example .env

# 3. Run in development mode
npm run dev
```

## Project Structure

```
aria-agent/
├── src/
│   ├── main/          # Electron main process + IPC
│   ├── renderer/      # React UI (Vite)
│   │   ├── components/
│   │   │   ├── layout/   # Sidebar, Header
│   │   │   └── panels/   # Dashboard, Chat, Email, ...
│   │   └── styles/
│   ├── core/          # Agent, Logger, Scheduler, Store, Permissions
│   ├── modules/       # Email, Files, Financial, System
│   └── utils/         # Crypto, Formatters, Validators
```

## Permission Levels

| Level | Name | Requires |
|---|---|---|
| 1 | Free | Auto-execute |
| 2 | Quick Confirm | Execute in 30s unless cancelled |
| 3 | Explicit Confirm | User must approve |
| 4 | PIN Confirm | Approval + PIN (payments, credentials) |

## Environment Variables

See `.env.example` for all required variables.  
**Never commit your real `.env` file.**

---

*ARIA v1.0 · Powered by Claude*
