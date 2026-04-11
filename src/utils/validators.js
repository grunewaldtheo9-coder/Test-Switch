'use strict'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidCNPJ(cnpj) {
  const n = cnpj.replace(/\D/g, '')
  if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false
  const calc = (s, len) => {
    let sum = 0, pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(s.charAt(len - i)) * pos--
      if (pos < 2) pos = 9
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11)
  }
  return calc(n, 12) === parseInt(n[12]) && calc(n, 13) === parseInt(n[13])
}

function isValidCPF(cpf) {
  const n = cpf.replace(/\D/g, '')
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false
  const calc = (s, len) => {
    let sum = 0
    for (let i = 1; i <= len; i++) sum += parseInt(s[i - 1]) * (len + 2 - i)
    const r = (sum * 10) % 11
    return r === 10 || r === 11 ? 0 : r
  }
  return calc(n, 9) === parseInt(n[9]) && calc(n, 10) === parseInt(n[10])
}

function sanitizePath(p) {
  return p.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '')
}

module.exports = { isValidEmail, isValidCNPJ, isValidCPF, sanitizePath }
