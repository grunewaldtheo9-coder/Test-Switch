'use strict'

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, dialog } = require('electron')
const path = require('path')
const fs   = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ── Icon resolution ────────────────────────────────────────────────────────────
// Works both in dev (repo root) and in packaged app (extraResources)

function resolveAsset(filename) {
  const candidates = [
    // Packaged: extraResources lands next to the app
    path.join(process.resourcesPath || '', 'assets', filename),
    // Dev: relative to repo root
    path.join(app.getAppPath(), 'assets', filename),
    // Fallback: two levels up from src/main/
    path.join(__dirname, '..', '..', 'assets', filename),
  ]
  return candidates.find((p) => fs.existsSync(p)) ?? null
}

function loadIcon(filename) {
  const iconPath = resolveAsset(filename)
  if (!iconPath) return nativeImage.createEmpty()
  return nativeImage.createFromPath(iconPath)
}

// ── Window ──────────────────────────────────────────────────────────────────

let mainWindow = null
let tray       = null

function createWindow() {
  const icon = loadIcon(process.platform === 'win32' ? 'icon.ico' : 'icon.png')

  mainWindow = new BrowserWindow({
    width:           1400,
    height:          900,
    minWidth:        900,
    minHeight:       600,
    backgroundColor: '#0f1117',
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame:           process.platform !== 'darwin',
    icon:            icon.isEmpty() ? undefined : icon,
    show:            false,   // show after ready-to-show
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,
    },
  })

  // Show window once content is ready (no white flash)
  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Prevent navigation outside the app
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })
}

// ── System Tray ──────────────────────────────────────────────────────────────

function createTray() {
  let icon = loadIcon('tray-icon.png')

  // Windows: prefer ICO for tray; resize for all platforms
  if (icon.isEmpty()) {
    icon = loadIcon('icon.ico')
  }
  if (!icon.isEmpty()) {
    icon = icon.resize({ width: 16, height: 16 })
  }

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  tray.setToolTip('ARIA — Autonomous Resident Intelligence Agent')

  const ctxMenu = Menu.buildFromTemplate([
    { label: 'Abrir ARIA',        click: () => mainWindow?.show() ?? createWindow() },
    { type: 'separator' },
    { label: 'Resumo do dia',     click: () => sendToRenderer('aria:command', 'resumo do dia') },
    { label: 'Verificar emails',  click: () => sendToRenderer('aria:command', 'verificar emails') },
    { label: 'Chat com ARIA',     click: () => { sendToRenderer('aria:command', 'chat'); mainWindow?.show() } },
    { type: 'separator' },
    {
      label: 'Modo Silencioso', type: 'checkbox', checked: false,
      click: (item) => sendToRenderer('aria:silent-mode', item.checked),
    },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() },
  ])

  tray.setContextMenu(ctxMenu)
  tray.on('double-click', () => mainWindow?.show() ?? createWindow())
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sendToRenderer(channel, data) {
  mainWindow?.webContents.send(channel, data)
}

// ── App lifecycle ──────────────────────────────────────────────────────────────

// Single instance lock — prevent multiple ARIA windows
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    // Windows: set App User Model ID for taskbar grouping and notifications
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.aria.agent')
    }

    createWindow()
    createTray()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    // On Windows/Linux: quit when all windows close (tray keeps it alive if user wants)
    if (process.platform !== 'darwin') {
      // Keep running in tray — do NOT quit
      // app.quit() — intentionally omitted
    }
  })

  app.on('before-quit', () => {
    tray?.destroy()
  })
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

require('./ipc-handlers')(ipcMain, { app, dialog, shell, mainWindow: () => mainWindow })
