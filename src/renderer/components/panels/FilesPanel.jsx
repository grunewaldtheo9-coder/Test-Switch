import React, { useState } from 'react'
import {
  FolderOpen, File, Image, FileText, Film, Music,
  Archive, Code, RefreshCw, Upload, Trash2, FolderInput,
  ChevronRight, Home,
} from 'lucide-react'
import clsx from 'clsx'

const EXT_ICON = {
  images:       { icon: Image,    color: 'text-pink-400' },
  documents:    { icon: FileText, color: 'text-blue-400' },
  spreadsheets: { icon: FileText, color: 'text-green-400' },
  videos:       { icon: Film,     color: 'text-purple-400' },
  audio:        { icon: Music,    color: 'text-yellow-400' },
  archives:     { icon: Archive,  color: 'text-orange-400' },
  code:         { icon: Code,     color: 'text-cyan-400' },
}

function getIcon(name) {
  const lower = name.toLowerCase()
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lower)) return EXT_ICON.images
  if (/\.(pdf|doc|docx|txt|md|rtf)$/i.test(lower))        return EXT_ICON.documents
  if (/\.(xls|xlsx|csv)$/i.test(lower))                   return EXT_ICON.spreadsheets
  if (/\.(mp4|mkv|avi|mov|webm)$/i.test(lower))           return EXT_ICON.videos
  if (/\.(mp3|wav|flac|aac)$/i.test(lower))               return EXT_ICON.audio
  if (/\.(zip|rar|7z|tar|gz)$/i.test(lower))              return EXT_ICON.archives
  if (/\.(js|ts|py|java|c|cpp|go|rb|html|css|json)$/i.test(lower)) return EXT_ICON.code
  return { icon: File, color: 'text-slate-400' }
}

function formatSize(bytes) {
  if (!bytes) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const MOCK_ENTRIES = [
  { name: 'Documentos',    isDir: true,  size: 0,          mtime: new Date() },
  { name: 'Imagens',       isDir: true,  size: 0,          mtime: new Date() },
  { name: 'Projetos',      isDir: true,  size: 0,          mtime: new Date() },
  { name: 'relatorio_maio.pdf', isDir: false, size: 245000, mtime: new Date() },
  { name: 'planilha.xlsx', isDir: false, size: 58000,      mtime: new Date() },
  { name: 'apresentacao.pptx', isDir: false, size: 1250000, mtime: new Date() },
  { name: 'foto_perfil.png',   isDir: false, size: 87000,  mtime: new Date() },
  { name: 'app.js',        isDir: false, size: 12300,      mtime: new Date() },
]

export default function FilesPanel({ addNotification }) {
  const [entries,      setEntries]      = useState(MOCK_ENTRIES)
  const [currentPath,  setCurrentPath]  = useState('~/Documentos/ARIA')
  const [selected,     setSelected]     = useState(null)
  const [organizing,   setOrganizing]   = useState(false)

  async function handleOrganize() {
    setOrganizing(true)
    if (window.aria) {
      const r = await window.aria.organizeFolder(currentPath)
      addNotification?.({
        type: 'success',
        title: 'Pasta organizada!',
        body: `${r.moved ?? 0} arquivos movidos.`,
      })
    } else {
      await new Promise((r) => setTimeout(r, 1200))
      addNotification?.({ type: 'success', title: 'Pasta organizada!', body: '5 arquivos movidos.' })
    }
    setOrganizing(false)
  }

  const dirs  = entries.filter((e) => e.isDir)
  const files = entries.filter((e) => !e.isDir)

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Toolbar */}
      <div className="card p-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-1 min-w-0">
          <Home size={12} />
          <ChevronRight size={12} />
          {currentPath.split('/').filter(Boolean).map((seg, i, arr) => (
            <React.Fragment key={i}>
              <span className={i === arr.length - 1 ? 'text-slate-300' : 'hover:text-slate-300 cursor-pointer'}>
                {seg}
              </span>
              {i < arr.length - 1 && <ChevronRight size={12} />}
            </React.Fragment>
          ))}
        </div>
        <button className="btn-ghost p-2"><RefreshCw size={14} /></button>
        <button
          onClick={handleOrganize}
          disabled={organizing}
          className="btn-primary text-xs disabled:opacity-60"
        >
          <FolderInput size={13} />
          {organizing ? 'Organizando...' : 'Organizar pasta'}
        </button>
      </div>

      {/* Grid */}
      <div className="card p-4 space-y-3">
        {/* Folders */}
        {dirs.length > 0 && (
          <>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Pastas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {dirs.map((entry) => (
                <button
                  key={entry.name}
                  onClick={() => setSelected(entry.name === selected ? null : entry.name)}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors text-center',
                    selected === entry.name
                      ? 'bg-aria-600/20 border-aria-500/50 text-aria-300'
                      : 'border-surface-border hover:bg-surface-elevated hover:border-aria-500/20 text-slate-300',
                  )}
                >
                  <FolderOpen size={24} className="text-yellow-400" />
                  <span className="text-xs truncate w-full">{entry.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Files */}
        {files.length > 0 && (
          <>
            <p className="text-xs text-slate-500 uppercase tracking-wide mt-2">Arquivos</p>
            <div className="space-y-1">
              {files.map((entry) => {
                const { icon: Icon, color } = getIcon(entry.name)
                return (
                  <button
                    key={entry.name}
                    onClick={() => setSelected(entry.name === selected ? null : entry.name)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      selected === entry.name
                        ? 'bg-aria-600/20 border border-aria-500/30'
                        : 'hover:bg-surface-elevated border border-transparent',
                    )}
                  >
                    <Icon size={16} className={color} />
                    <span className="flex-1 text-sm text-slate-300 truncate">{entry.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{formatSize(entry.size)}</span>
                    {selected === entry.name && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addNotification?.({ type: 'warning', title: 'Confirmação necessária', body: `Deletar "${entry.name}"? (Nível 3)` })
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
