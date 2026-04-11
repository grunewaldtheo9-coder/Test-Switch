'use strict'

/**
 * AES-256 encryption helpers using native Node crypto.
 * Keys are derived with PBKDF2 from a master passphrase.
 */

const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const SALT_LEN  = 32
const IV_LEN    = 16
const TAG_LEN   = 16
const ITER      = 100_000
const KEY_LEN   = 32

function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, ITER, KEY_LEN, 'sha256')
}

function encrypt(plaintext, passphrase) {
  const salt   = crypto.randomBytes(SALT_LEN)
  const iv     = crypto.randomBytes(IV_LEN)
  const key    = deriveKey(passphrase, salt)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag       = cipher.getAuthTag()

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
}

function decrypt(ciphertext, passphrase) {
  const buf  = Buffer.from(ciphertext, 'base64')
  const salt = buf.slice(0, SALT_LEN)
  const iv   = buf.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const tag  = buf.slice(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN)
  const data = buf.slice(SALT_LEN + IV_LEN + TAG_LEN)

  const key     = deriveKey(passphrase, salt)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(data) + decipher.final('utf8')
}

module.exports = { encrypt, decrypt }
