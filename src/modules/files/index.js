'use strict'

const fs   = require('fs')
const path = require('path')

const TYPE_MAP = {
  images:      ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff'],
  documents:   ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf', '.md'],
  spreadsheets:['.xls', '.xlsx', '.ods', '.csv'],
  presentations:['.ppt', '.pptx', '.odp'],
  videos:      ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'],
  audio:       ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
  installers:  ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.appimage'],
  archives:    ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
  code:        ['.js', '.ts', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rb', '.php', '.html', '.css', '.json', '.xml'],
}

/**
 * Organise a folder into typed sub-directories.
 * Returns a summary { moved, skipped, errors }.
 */
async function organizeFolder(dir) {
  if (!fs.existsSync(dir)) return { error: `Pasta não encontrada: ${dir}` }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const result  = { moved: 0, skipped: 0, errors: [] }

  for (const entry of entries) {
    if (!entry.isFile()) { result.skipped++; continue }

    const ext      = path.extname(entry.name).toLowerCase()
    const category = getCategory(ext)
    if (!category) { result.skipped++; continue }

    const destDir = path.join(dir, capitalize(category))
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

    const src = path.join(dir, entry.name)
    const dst = path.join(destDir, entry.name)

    try {
      fs.renameSync(src, dst)
      result.moved++
    } catch (err) {
      result.errors.push({ file: entry.name, error: err.message })
    }
  }

  return result
}

function getCategory(ext) {
  for (const [cat, exts] of Object.entries(TYPE_MAP)) {
    if (exts.includes(ext)) return cat
  }
  return null
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Search files recursively by name pattern or extension.
 */
async function searchFiles(rootDir, { pattern, ext, maxDepth = 5 } = {}) {
  const results = []

  function walk(dir, depth) {
    if (depth > maxDepth) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) }
    catch { return }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1)
      } else {
        const matchName = !pattern || entry.name.toLowerCase().includes(pattern.toLowerCase())
        const matchExt  = !ext     || path.extname(entry.name).toLowerCase() === ext.toLowerCase()
        if (matchName && matchExt) results.push(fullPath)
      }
    }
  }

  walk(rootDir, 0)
  return results
}

/**
 * Get disk usage of a directory (in bytes).
 */
async function getDirSize(dir) {
  let total = 0

  function walk(d) {
    let entries
    try { entries = fs.readdirSync(d, { withFileTypes: true }) }
    catch { return }
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else try { total += fs.statSync(p).size } catch { /* skip */ }
    }
  }

  walk(dir)
  return total
}

module.exports = { organizeFolder, searchFiles, getDirSize, TYPE_MAP }
