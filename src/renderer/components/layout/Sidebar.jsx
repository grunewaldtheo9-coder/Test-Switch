import React from 'react'
import {
  LayoutDashboard, MessageSquare, Mail, CalendarDays,
  FolderOpen, TrendingUp, Monitor, ScrollText,
  Settings, BellOff, Bell, Bot,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'chat',      label: 'Chat ARIA',  icon: MessageSquare },
  { id: 'email',     label: 'Emails',     icon: Mail },
  { id: 'calendar',  label: 'Calendário', icon: CalendarDays },
  { id: 'files',     label: 'Arquivos',   icon: FolderOpen },
  { id: 'financial', label: 'Financeiro', icon: TrendingUp },
  { id: 'system',    label: 'Sistema',    icon: Monitor },
  { id: 'logs',      label: 'Logs',       icon: ScrollText },
]

export default function Sidebar({ active, onChange, silentMode, onToggleSilent }) {
  return (
    <aside className="w-56 flex flex-col border-r border-surface-border bg-surface-card shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-aria-600 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-100 leading-none">ARIA</p>
          <p className="text-xs text-slate-500 leading-none mt-0.5">v1.0.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
              active === id
                ? 'bg-aria-600/20 text-aria-400 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-surface-border space-y-0.5">
        <button
          onClick={onToggleSilent}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
            silentMode ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
          )}
        >
          {silentMode ? <BellOff size={16} /> : <Bell size={16} />}
          {silentMode ? 'Modo Silencioso' : 'Notificações'}
        </button>
        <button
          onClick={() => onChange('settings')}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
            active === 'settings'
              ? 'bg-aria-600/20 text-aria-400 font-medium'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
          )}
        >
          <Settings size={16} />
          Configurações
        </button>
      </div>
    </aside>
  )
}
