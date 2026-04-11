import React, { useState, useEffect } from 'react'
import { Settings, Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'

const PANEL_LABELS = {
  dashboard: 'Dashboard',
  chat:      'Chat com ARIA',
  email:     'Gestão de Emails',
  calendar:  'Calendário & Agenda',
  files:     'Gerenciador de Arquivos',
  financial: 'Painel Financeiro',
  system:    'Diagnóstico do Sistema',
  logs:      'Log de Atividades',
  settings:  'Configurações',
}

export default function Header({ panelName, settings, onOpenSettings }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  const greeting = (() => {
    const h = now.getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-surface-border bg-surface-card shrink-0">
      <div>
        <h1 className="text-base font-semibold text-slate-100">{PANEL_LABELS[panelName] ?? panelName}</h1>
        {settings?.user?.name && (
          <p className="text-xs text-slate-500">{greeting}, {settings.user.name}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-300">{timeStr}</p>
          <p className="text-xs text-slate-500 capitalize">{dateStr}</p>
        </div>

        <div className={clsx('flex items-center gap-1.5 text-xs', online ? 'text-green-400' : 'text-red-400')}>
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
        </div>

        <button onClick={onOpenSettings} className="btn-ghost p-2">
          <Settings size={16} />
        </button>
      </div>
    </header>
  )
}
