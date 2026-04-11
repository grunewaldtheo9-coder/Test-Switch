'use strict'

/**
 * Persistent settings store using electron-store.
 * Falls back to a plain JSON file when running outside Electron.
 */

const path = require('path')
const os   = require('os')
const fs   = require('fs')

const SETTINGS_DIR  = path.join(os.homedir(), 'ARIA_Backups')
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json')

const DEFAULTS = {
  user: {
    name:       '',
    profession: '',
    company:    '',
    language:   'pt-BR',
    timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  workHours: { start: '08:00', end: '18:00', days: [1, 2, 3, 4, 5] },
  routines: {
    morningEnabled:    true,
    morningTime:       '08:00',
    eveningEnabled:    true,
    eveningTime:       '18:00',
    weeklyEnabled:     true,
    monthlyEnabled:    true,
  },
  notifications: { mode: 'popup', sound: true },
  autonomy: 'moderate',
  security: { pinLevel: 4, sessionTimeoutMinutes: 480 },
  financial: { alertBalanceMin: 0, autoPaymentLimit: 0 },
  backup: { path: path.join(os.homedir(), 'ARIA_Backups'), frequency: 'daily' },
  integrations: {},
  onboardingDone: false,
}

function createStore() {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true })
  }

  function load() {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }
      }
    } catch { /* ignore */ }
    return { ...DEFAULTS }
  }

  function save(data) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8')
  }

  function getAll()    { return load() }
  function setAll(d)   { save({ ...load(), ...d }) }
  function get(key)    { return load()[key] }
  function set(key, v) { const d = load(); d[key] = v; save(d) }

  return { getAll, setAll, get, set }
}

module.exports = { createStore }
