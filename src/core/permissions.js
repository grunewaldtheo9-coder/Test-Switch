'use strict'

/**
 * ARIA Permission System
 *
 * Level 1 — FREE:            read, search, reports, drafts
 * Level 2 — QUICK CONFIRM:   auto-replies, move to trash, close apps
 * Level 3 — EXPLICIT CONFIRM: send new email, delete permanently, run scripts
 * Level 4 — PIN CONFIRM:     payments, transfers, security settings
 */

const LEVELS = {
  FREE:           1,
  QUICK_CONFIRM:  2,
  EXPLICIT:       3,
  PIN:            4,
}

const ACTION_LEVELS = {
  // Level 1
  read_email:       1,
  read_file:        1,
  search_web:       1,
  create_draft:     1,
  list_directory:   1,
  generate_report:  1,
  view_calendar:    1,
  view_financial:   1,
  take_screenshot:  1,

  // Level 2
  send_auto_reply:  2,
  move_to_trash:    2,
  close_app:        2,
  run_backup:       2,
  update_template:  2,

  // Level 3
  send_email:       3,
  delete_permanent: 3,
  run_script:       3,
  modify_settings:  3,
  install_app:      3,
  send_message:     3,

  // Level 4
  make_payment:     4,
  bank_transfer:    4,
  share_credential: 4,
  modify_security:  4,
}

function getLevel(action) {
  return ACTION_LEVELS[action] ?? 3 // default to explicit if unknown
}

function requiresConfirmation(action) {
  return getLevel(action) >= LEVELS.QUICK_CONFIRM
}

function requiresPin(action) {
  return getLevel(action) >= LEVELS.PIN
}

module.exports = { LEVELS, getLevel, requiresConfirmation, requiresPin, ACTION_LEVELS }
