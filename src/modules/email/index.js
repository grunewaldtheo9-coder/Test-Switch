'use strict'

/**
 * ARIA Email Module
 * Handles IMAP reading and SMTP sending.
 * Real credentials are provided via settings/integrations.
 */

const nodemailer = require('nodemailer')
const Imap       = require('imap')
const { simpleParser } = require('mailparser')

/**
 * Create an email manager for a given account config.
 * config: { host, port, user, password, smtpHost, smtpPort, secure }
 */
function createEmailManager(config, logger) {
  // ── Fetch unread emails ──────────────────────────────────────────────────

  async function fetchUnread(limit = 20) {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user:     config.user,
        password: config.password,
        host:     config.host,
        port:     config.port ?? 993,
        tls:      true,
        tlsOptions: { rejectUnauthorized: false },
      })

      const messages = []

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) { imap.end(); reject(err); return }

          imap.search(['UNSEEN'], (err, uids) => {
            if (err || !uids.length) { imap.end(); resolve([]); return }

            const toFetch = uids.slice(-limit)
            const f = imap.fetch(toFetch, { bodies: '' })

            f.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, (err, parsed) => {
                  if (!err) messages.push({
                    id:      parsed.messageId,
                    from:    parsed.from?.text,
                    subject: parsed.subject,
                    date:    parsed.date,
                    text:    parsed.text?.slice(0, 500),
                    hasAttachment: (parsed.attachments?.length ?? 0) > 0,
                  })
                })
              })
            })

            f.once('error', (err) => { imap.end(); reject(err) })
            f.once('end', ()  => { imap.end() })
          })
        })
      })

      imap.once('end',   () => resolve(messages))
      imap.once('error', reject)
      imap.connect()
    })
  }

  // ── Send email ───────────────────────────────────────────────────────────

  async function send({ to, subject, text, html, attachments }) {
    const transporter = nodemailer.createTransport({
      host:   config.smtpHost,
      port:   config.smtpPort ?? 587,
      secure: config.secure ?? false,
      auth:   { user: config.user, pass: config.password },
    })

    const info = await transporter.sendMail({
      from:        config.user,
      to,
      subject,
      text,
      html,
      attachments,
    })

    logger.info('email-sent', { to, subject, messageId: info.messageId })
    return info
  }

  // ── Classify priority ────────────────────────────────────────────────────

  function classify(email, keywords = ['urgente', 'urgent', 'prazo', 'deadline', 'asap', 'importante']) {
    const text = `${email.subject ?? ''} ${email.text ?? ''}`.toLowerCase()
    if (keywords.some((k) => text.includes(k))) return 'high'
    return 'normal'
  }

  return { fetchUnread, send, classify }
}

module.exports = { createEmailManager }
