'use strict'

/**
 * ARIA Financial Module
 * Manages bills, transactions, and financial reports.
 * No payment is ever executed without explicit user confirmation.
 */

const fs   = require('fs')
const path = require('path')
const os   = require('os')

const DATA_FILE = path.join(os.homedir(), 'ARIA_Backups', 'financial.json')

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch { /* ignore */ }
  return { bills: [], transactions: [], accounts: [] }
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// ── Bills ─────────────────────────────────────────────────────────────────────

function addBill({ description, amount, dueDate, beneficiary, recurring = false }) {
  const data = load()
  const bill = {
    id:          Date.now().toString(),
    description,
    amount,
    dueDate,
    beneficiary,
    recurring,
    paid:        false,
    createdAt:   new Date().toISOString(),
  }
  data.bills.push(bill)
  save(data)
  return bill
}

function getBillsDueSoon(days = 7) {
  const { bills } = load()
  const now = Date.now()
  return bills.filter((b) => {
    if (b.paid) return false
    const due = new Date(b.dueDate).getTime()
    return due - now <= days * 86_400_000 && due >= now
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
}

function markPaid(billId) {
  const data = load()
  const bill = data.bills.find((b) => b.id === billId)
  if (bill) { bill.paid = true; bill.paidAt = new Date().toISOString() }
  save(data)
  return bill
}

// ── Transactions ──────────────────────────────────────────────────────────────

function addTransaction({ description, amount, category, type, date }) {
  const data = load()
  const tx = {
    id:          Date.now().toString(),
    description,
    amount:      Math.abs(amount),
    category:    category ?? 'Outros',
    type:        type ?? (amount >= 0 ? 'income' : 'expense'),
    date:        date ?? new Date().toISOString(),
  }
  data.transactions.push(tx)
  save(data)
  return tx
}

function getMonthSummary(year, month) {
  const { transactions } = load()
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })

  const income   = filtered.filter((t) => t.type === 'income')  .reduce((s, t) => s + t.amount, 0)
  const expenses = filtered.filter((t) => t.type === 'expense') .reduce((s, t) => s + t.amount, 0)

  const byCategory = {}
  for (const t of filtered.filter((t) => t.type === 'expense')) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  }

  return { income, expenses, net: income - expenses, byCategory, count: filtered.length }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

function setAccount({ name, bank, balance, alertBelow = 0 }) {
  const data = load()
  const existing = data.accounts.find((a) => a.name === name)
  if (existing) {
    Object.assign(existing, { bank, balance, alertBelow })
  } else {
    data.accounts.push({ name, bank, balance, alertBelow, updatedAt: new Date().toISOString() })
  }
  save(data)
}

function getAccounts() {
  return load().accounts
}

function getLowBalanceAlerts() {
  return load().accounts.filter((a) => a.balance < a.alertBelow)
}

module.exports = {
  addBill, getBillsDueSoon, markPaid,
  addTransaction, getMonthSummary,
  setAccount, getAccounts, getLowBalanceAlerts,
}
