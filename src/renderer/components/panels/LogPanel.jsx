import React, { useState, useEffect } from 'react'
import { RefreshCw, Filter, Download } from 'lucide-react'
import clsx from 'clsx'

const MOCK_LOGS = [
  { timestamp: '2026-04-11T08:00:01Z', level: 'info',  action: 'routine-start',    namespace: 'scheduler', description: 'Rotina matinal iniciada' },
  { timestamp: '2026-04-11T08:00:02Z', level: 'info',  action: 'email-check',      namespace: 'email',     description: '3 emails não lidos encontrados' },
  { timestamp: '2026-04-11T08:00:03Z', level: 'info',  action: 'calendar-sync',    namespace: 'calendar',  description: 'Agenda carregada: 2 eventos hoje' },
  { timestamp: '2026-04-11T08:00:05Z', level: 'info',  action: 'routine-done',     namespace: 'scheduler', description: 'Rotina matinal concluída' },
  { timestamp: '2026-04-11T08:15:12Z', level: 'info',  action: 'agent-response',   namespace: 'ipc',       description: 'Mensagem processada pelo agente' },
  { timestamp: '2026-04-11T09:30:00Z', level: 'warn',  action: 'disk-alert',       namespace: 'system',    description: 'Disco com 68% de uso' },
  { timestamp: '2026-04-11T10:00:00Z', level: 'info',  action: 'backup-scheduled', namespace: 'scheduler', description: 'Backup agendado para 18:00' },
]

const LEVEL_STYLE = {
  info:  'text-aria-400  bg-aria-500/10  border-aria-500/20',
  warn:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  error: 'text-red-400    bg-red-500/10    border-red-500/20',
  debug: 'text-slate-400  bg-slate-500/10  border-slate-500/20',
}

export default function LogPanel() {
  const [logs,    setLogs]    = useState(MOCK_LOGS)
  const [filter,  setFilter]  = useState('all')
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    if (window.aria) {
      const l = await window.aria.getLogs({ limit: 200 })
      if (l.length > 0) setLogs(l)
    }
    setLoading(false)
  }

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.level === filter)

  function formatTs(ts) {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="card p-4 flex items-center gap-3">
        <Filter size={14} className="text-slate-500" />
        {['all', 'info', 'warn', 'error'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-lg transition-colors capitalize',
              filter === f ? 'bg-aria-600/30 text-aria-300 font-medium' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={refresh} disabled={loading} className="btn-ghost text-xs gap-1.5">
            <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
            Atualizar
          </button>
          <button className="btn-ghost text-xs gap-1.5">
            <Download size={13} /> Exportar
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-surface-border bg-surface-elevated">
                <th className="text-left py-2.5 px-4 font-medium">Hora</th>
                <th className="text-left py-2.5 px-4 font-medium">Nível</th>
                <th className="text-left py-2.5 px-4 font-medium">Módulo</th>
                <th className="text-left py-2.5 px-4 font-medium">Ação</th>
                <th className="text-left py-2.5 px-4 font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {filtered.map((log, i) => (
                <tr key={i} className="hover:bg-surface-elevated/50">
                  <td className="py-2.5 px-4 text-slate-500">{formatTs(log.timestamp)}</td>
                  <td className="py-2.5 px-4">
                    <span className={clsx('px-2 py-0.5 rounded-full border text-xs', LEVEL_STYLE[log.level] ?? LEVEL_STYLE.info)}>
                      {log.level}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{log.namespace}</td>
                  <td className="py-2.5 px-4 text-slate-300">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-400">{log.description ?? log.error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs text-slate-600 border-t border-surface-border">
          {filtered.length} entradas
        </div>
      </div>
    </div>
  )
}
