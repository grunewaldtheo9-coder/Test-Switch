'use strict'

const fs   = require('fs')
const path = require('path')
const os   = require('os')

const LOG_DIR = path.join(os.homedir(), 'ARIA_Backups', 'logs')

function createLogger(namespace = 'aria') {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }

  const logFile = path.join(LOG_DIR, `aria-${today()}.log`)

  function write(level, action, meta = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      namespace,
      level,
      action,
      ...meta,
    }
    const line = JSON.stringify(entry)
    fs.appendFileSync(logFile, line + '\n', 'utf8')
    if (process.env.LOG_LEVEL === 'debug' || level === 'error') {
      console.log(`[ARIA:${namespace}] ${level.toUpperCase()} ${action}`, meta)
    }
  }

  function info(action, meta)  { write('info',  action, meta) }
  function warn(action, meta)  { write('warn',  action, meta) }
  function error(action, meta) { write('error', action, meta) }
  function debug(action, meta) { write('debug', action, meta) }

  function query({ date, namespace: ns, limit = 200 } = {}) {
    try {
      const target = date ? `aria-${date}.log` : `aria-${today()}.log`
      const file = path.join(LOG_DIR, target)
      if (!fs.existsSync(file)) return []

      return fs.readFileSync(file, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => { try { return JSON.parse(l) } catch { return null } })
        .filter(Boolean)
        .filter((e) => !ns || e.namespace === ns)
        .slice(-limit)
    } catch {
      return []
    }
  }

  return { info, warn, error, debug, query }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

module.exports = { createLogger }
