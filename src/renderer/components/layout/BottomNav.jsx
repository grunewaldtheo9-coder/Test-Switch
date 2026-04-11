import React from 'react'
import {
  LayoutDashboard, MessageSquare, TrendingUp,
  FolderOpen, Settings, Mail,
} from 'lucide-react'
import clsx from 'clsx'

// Only show the most important panels in the bottom nav (Android space is limited)
const ITEMS = [
  { id: 'dashboard', label: 'Início',     icon: LayoutDashboard },
  { id: 'chat',      label: 'ARIA',       icon: MessageSquare   },
  { id: 'email',     label: 'Email',      icon: Mail            },
  { id: 'financial', label: 'Finanças',   icon: TrendingUp      },
  { id: 'settings',  label: 'Config',     icon: Settings        },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={clsx(
              'bottom-nav-item',
              isActive ? 'text-aria-400' : 'text-slate-500',
            )}
          >
            <div className={clsx(
              'p-1.5 rounded-xl transition-colors',
              isActive ? 'bg-aria-600/20' : '',
            )}>
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            </div>
            <span className={clsx('text-[10px] font-medium', isActive ? 'text-aria-400' : 'text-slate-600')}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
