import React from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import clsx from 'clsx'

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
  routine: Info,
}

const COLORS = {
  success: 'border-green-500/30  bg-green-500/10  text-green-300',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  error:   'border-red-500/30    bg-red-500/10    text-red-300',
  info:    'border-aria-500/30   bg-aria-500/10   text-aria-300',
  routine: 'border-aria-500/30   bg-aria-500/10   text-aria-300',
}

export default function NotificationToast({ notification, onClose }) {
  const type  = notification.type ?? 'info'
  const Icon  = ICONS[type] ?? Info
  const color = COLORS[type] ?? COLORS.info

  return (
    <div
      className={clsx(
        'pointer-events-auto flex items-start gap-3 p-3 rounded-xl border max-w-sm shadow-2xl animate-slide-up',
        color,
      )}
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="font-semibold text-sm leading-none mb-1">{notification.title}</p>
        )}
        {notification.body && (
          <p className="text-xs opacity-80 leading-relaxed">{notification.body}</p>
        )}
      </div>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}
