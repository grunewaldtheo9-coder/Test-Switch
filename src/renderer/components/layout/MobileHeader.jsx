import React, { useState, useEffect } from 'react'
import { Bot, Bell, BellOff, Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'

const PANEL_LABELS = {
  dashboard: 'Início',
  chat:      'ARIA',
  email:     'Emails',
  calendar:  'Calendário',
  files:     'Arquivos',
  financial: 'Financeiro',
  system:    'Sistema',
  logs:      'Logs',
  settings:  'Configurações',
}

export default function MobileHeader({ panelName, settings, silentMode, onToggleSilent }) {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-card shrink-0">
      {/* Logo */}
      <div className="w-7 h-7 rounded-lg bg-aria-600 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-white" />
      </div>

      {/* Panel title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-100 truncate">
          {PANEL_LABELS[panelName] ?? panelName}
        </h1>
        {settings?.user?.name && (
          <p className="text-[10px] text-slate-500 leading-none">{settings.user.name}</p>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-2">
        <div className={clsx('w-1.5 h-1.5 rounded-full', online ? 'bg-green-400' : 'bg-red-400')} />

        <button
          onClick={onToggleSilent}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            silentMode ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-500 hover:text-slate-300',
          )}
        >
          {silentMode ? <BellOff size={15} /> : <Bell size={15} />}
        </button>
      </div>
    </header>
  )
}
