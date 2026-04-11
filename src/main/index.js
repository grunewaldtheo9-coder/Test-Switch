'use strict'

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null
let tray = null

// ── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1117',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

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
}

// ── System Tray ──────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png')
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty()

  tray = new Tray(icon)
  tray.setToolTip('ARIA — Autonomous Resident Intelligence Agent')

  const menu = Menu.buildFromTemplate([
    { label: 'Abrir ARIA', click: () => { mainWindow?.show() ?? createWindow() } },
    { type: 'separator' },
    { label: 'Resumo do dia',  click: () => sendToRenderer('aria:command', 'resumo do dia') },
    { label: 'Verificar emails', click: () => sendToRenderer('aria:command', 'verificar emails') },
    { type: 'separator' },
    { label: 'Modo Silencioso', type: 'checkbox', checked: false,
      click: (item) => sendToRenderer('aria:silent-mode', item.checked) },
    { type: 'separator' },
    { label: 'Sair', click: () => { app.quit() } },
  ])

  tray.setContextMenu(menu)
  tray.on('double-click', () => mainWindow?.show() ?? createWindow())
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sendToRenderer(channel, data) {
  mainWindow?.webContents.send(channel, data)
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC handlers ─────────────────────────────────────────────────────────────
// All handlers are registered in ipc-handlers.js

require('./ipc-handlers')(ipcMain, { app, dialog, shell, mainWindow: () => mainWindow })
