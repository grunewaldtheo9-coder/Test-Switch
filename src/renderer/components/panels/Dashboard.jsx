import React, { useState, useEffect } from 'react'
import {
  Mail, CalendarDays, CheckSquare, TrendingUp,
  Cpu, HardDrive, MemoryStick, AlertTriangle,
  ArrowRight, Clock, Zap,
} from 'lucide-react'
import clsx from 'clsx'

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'aria', onClick }) {
  const colorMap = {
    aria:   'text-aria-400   bg-aria-500/10   border-aria-500/20',
    green:  'text-green-400  bg-green-500/10  border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red:    'text-red-400    bg-red-500/10    border-red-500/20',
    blue:   'text-blue-400   bg-blue-500/10   border-blue-500/20',
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        'card p-4 flex items-center gap-4 text-left w-full hover:border-aria-500/40 transition-colors',
        onClick && 'cursor-pointer',
      )}
    >
      <div className={clsx('p-2.5 rounded-lg border', colorMap[color])}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-100 leading-none mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>}
      </div>
    </button>
  )
}

// ── Resource Bar ─────────────────────────────────────────────────────────────

function ResourceBar({ label, value, icon: Icon }) {
  const color = value > 90 ? 'bg-red-500' : value > 70 ? 'bg-yellow-500' : 'bg-aria-500'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Icon size={12} /> {label}
        </span>
        <span className={clsx('font-mono font-medium', value > 90 ? 'text-red-400' : 'text-slate-300')}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// ── Activity Item ─────────────────────────────────────────────────────────────

function ActivityItem({ icon, label, time, status }) {
  const statusColor = {
    done:    'text-green-400',
    pending: 'text-yellow-400',
    error:   'text-red-400',
  }[status] ?? 'text-slate-400'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-surface-border last:border-0">
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-slate-300 truncate">{label}</span>
      <span className={clsx('text-xs font-mono shrink-0', statusColor)}>{time}</span>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({ cpu: 0, ram: 0, disk: 0, temp: null })
  const [time,  setTime]  = useState(new Date())

  useEffect(() => {
    let id
    async function refresh() {
      if (window.aria) {
        const s = await window.aria.getSystemStats()
        setStats(s)
      } else {
        setStats({ cpu: Math.round(Math.random() * 40 + 10), ram: Math.round(Math.random() * 30 + 30), disk: 58, temp: 62 })
      }
    }
    refresh()
    id = setInterval(refresh, 8000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const MOCK_ACTIVITY = [
    { icon: '✅', label: 'Rotina matinal executada',        time: '08:00', status: 'done'    },
    { icon: '📧', label: '3 emails não lidos verificados',  time: '08:01', status: 'done'    },
    { icon: '📅', label: 'Agenda do dia carregada',         time: '08:01', status: 'done'    },
    { icon: '⚡', label: 'Relatório semanal pendente',       time: '09:00', status: 'pending' },
    { icon: '💾', label: 'Backup automático agendado',       time: '18:00', status: 'pending' },
  ]

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Hero greeting */}
      <div className="card p-5 flex items-center gap-4 bg-gradient-to-r from-aria-900/40 to-surface-card">
        <div className="w-12 h-12 rounded-xl bg-aria-600 flex items-center justify-center text-2xl shrink-0">
          🤖
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">{greeting}! Tudo sob controle.</h2>
          <p className="text-sm text-slate-400">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <Zap size={12} className="text-aria-400" />
          <span>ARIA ativa</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Mail}         label="Emails não lidos" value="—"  sub="Conecte sua conta" color="blue"   onClick={() => onNavigate('email')} />
        <StatCard icon={CalendarDays} label="Compromissos hoje" value="—" sub="Conecte o calendário" color="aria" onClick={() => onNavigate('calendar')} />
        <StatCard icon={CheckSquare}  label="Tarefas pendentes" value="0" sub="Todas em dia"       color="green"  onClick={() => onNavigate('chat')} />
        <StatCard icon={TrendingUp}   label="Contas a vencer"   value="0" sub="Nos próximos 7 dias" color="yellow" onClick={() => onNavigate('financial')} />
      </div>

      {/* Resources + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* System resources */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-200">Recursos do Sistema</h3>
            <button onClick={() => onNavigate('system')} className="btn-ghost py-1 px-2 text-xs">
              Ver tudo <ArrowRight size={12} />
            </button>
          </div>
          <ResourceBar label="CPU"  value={stats.cpu}  icon={Cpu} />
          <ResourceBar label="RAM"  value={stats.ram}  icon={MemoryStick} />
          <ResourceBar label="Disco" value={stats.disk} icon={HardDrive} />
          {stats.temp && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-border">
              <span className="text-slate-500">Temperatura CPU</span>
              <span className={clsx('font-mono font-medium', stats.temp > 80 ? 'text-red-400' : 'text-slate-300')}>
                {stats.temp}°C
              </span>
            </div>
          )}
        </div>

        {/* Activity log */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-200">Atividade Recente</h3>
            <button onClick={() => onNavigate('logs')} className="btn-ghost py-1 px-2 text-xs">
              Log completo <ArrowRight size={12} />
            </button>
          </div>
          {MOCK_ACTIVITY.map((a, i) => (
            <ActivityItem key={i} {...a} />
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="card p-4 flex items-start gap-3 border-yellow-500/20 bg-yellow-500/5">
        <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-300">Configure integrações para liberar todo o potencial da ARIA</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Conecte seu email, calendário e banco para ativar automações e relatórios em tempo real.
          </p>
        </div>
        <button onClick={() => onNavigate('settings')} className="ml-auto btn-ghost py-1 px-2 text-xs shrink-0">
          Configurar
        </button>
      </div>
    </div>
  )
}
