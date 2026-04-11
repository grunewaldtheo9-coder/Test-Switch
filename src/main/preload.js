'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('aria', {
  // ── System ──────────────────────────────────────────────────────────────
  getSystemInfo:  () => ipcRenderer.invoke('system:info'),
  getSystemStats: () => ipcRenderer.invoke('system:stats'),
  openPath:   (p) => ipcRenderer.invoke('shell:open-path', p),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  showSaveDialog: (opts) => ipcRenderer.invoke('dialog:save', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('dialog:open', opts),

  // ── Agent ────────────────────────────────────────────────────────────────
  sendMessage: (msg) => ipcRenderer.invoke('agent:message', msg),
  getHistory:  ()    => ipcRenderer.invoke('agent:history'),

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings: ()       => ipcRenderer.invoke('settings:get'),
  saveSettings: (data)  => ipcRenderer.invoke('settings:save', data),

  // ── Logs ─────────────────────────────────────────────────────────────────
  getLogs: (opts) => ipcRenderer.invoke('logs:get', opts),

  // ── Files ────────────────────────────────────────────────────────────────
  listDirectory: (dir)  => ipcRenderer.invoke('files:list', dir),
  readFile:      (p)    => ipcRenderer.invoke('files:read', p),
  moveFile:      (src, dst) => ipcRenderer.invoke('files:move', { src, dst }),
  deleteFile:    (p)    => ipcRenderer.invoke('files:delete', p),
  organizeFolder: (dir) => ipcRenderer.invoke('files:organize', dir),

  // ── Notifications ─────────────────────────────────────────────────────────
  onNotification: (cb) => {
    ipcRenderer.on('aria:notification', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('aria:notification')
  },
  onCommand: (cb) => {
    ipcRenderer.on('aria:command', (_e, cmd) => cb(cmd))
    return () => ipcRenderer.removeAllListeners('aria:command')
  },
  onSilentMode: (cb) => {
    ipcRenderer.on('aria:silent-mode', (_e, v) => cb(v))
    return () => ipcRenderer.removeAllListeners('aria:silent-mode')
  },
})
