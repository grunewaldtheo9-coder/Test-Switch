'use strict'

const os = require('os')
const fs = require('fs')
const path = require('path')
const si = require('systeminformation')

const { createAgentCore } = require('../core/agent')
const { createLogger }    = require('../core/logger')
const { createStore }     = require('../core/store')
const { organizeFolder }  = require('../modules/files')

const logger = createLogger('ipc')
const store  = createStore()
const agent  = createAgentCore(store, logger)

module.exports = function registerHandlers(ipcMain, { dialog, shell }) {

  // ── System ──────────────────────────────────────────────────────────────

  ipcMain.handle('system:info', async () => ({
    platform: os.platform(),
    arch:     os.arch(),
    hostname: os.hostname(),
    username: os.userInfo().username,
    homedir:  os.homedir(),
    release:  os.release(),
    totalMem: os.totalmem(),
  }))

  ipcMain.handle('system:stats', async () => {
    try {
      const [cpu, mem, disk, temp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.cpuTemperature().catch(() => ({ main: null })),
      ])
      return {
        cpu:  Math.round(cpu.currentLoad),
        ram:  Math.round((mem.used / mem.total) * 100),
        disk: disk[0] ? Math.round((disk[0].used / disk[0].size) * 100) : 0,
        temp: temp.main,
      }
    } catch {
      return { cpu: 0, ram: 0, disk: 0, temp: null }
    }
  })

  // ── Shell ────────────────────────────────────────────────────────────────

  ipcMain.handle('shell:open-path',     async (_e, p)   => shell.openPath(p))
  ipcMain.handle('shell:open-external', async (_e, url) => shell.openExternal(url))

  // ── Dialogs ──────────────────────────────────────────────────────────────

  ipcMain.handle('dialog:save', async (_e, opts) => dialog.showSaveDialog(opts))
  ipcMain.handle('dialog:open', async (_e, opts) => dialog.showOpenDialog(opts))

  // ── Agent ────────────────────────────────────────────────────────────────

  ipcMain.handle('agent:message', async (_e, msg) => {
    logger.info('user-message', { length: msg.length })
    return agent.chat(msg)
  })

  ipcMain.handle('agent:history', async () => agent.getHistory())

  // ── Settings ─────────────────────────────────────────────────────────────

  ipcMain.handle('settings:get',  async ()      => store.getAll())
  ipcMain.handle('settings:save', async (_e, d) => { store.setAll(d); return true })

  // ── Logs ─────────────────────────────────────────────────────────────────

  ipcMain.handle('logs:get', async (_e, opts = {}) => logger.query(opts))

  // ── Files ────────────────────────────────────────────────────────────────

  ipcMain.handle('files:list', async (_e, dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      return entries.map((e) => ({
        name:    e.name,
        isDir:   e.isDirectory(),
        size:    e.isFile() ? fs.statSync(path.join(dir, e.name)).size : 0,
        mtime:   fs.statSync(path.join(dir, e.name)).mtime,
      }))
    } catch (err) {
      return { error: err.message }
    }
  })

  ipcMain.handle('files:read', async (_e, p) => {
    try { return fs.readFileSync(p, 'utf8') }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('files:move', async (_e, { src, dst }) => {
    try { fs.renameSync(src, dst); return true }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('files:delete', async (_e, p) => {
    try { fs.unlinkSync(p); return true }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('files:organize', async (_e, dir) => organizeFolder(dir))
}
