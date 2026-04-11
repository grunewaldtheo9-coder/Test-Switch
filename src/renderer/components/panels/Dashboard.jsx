import React, { useState, useEffect } from 'react'
import {
  MessageSquare, CalendarDays, TrendingUp, Cpu,
  HardDrive, MemoryStick, AlertTriangle, ArrowRight,
  Zap, CheckCircle,
} from 'lucide-react'
import clsx from 'clsx'

// ── Stat Card ─────────────────────────────────────────────────────────────────

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
        'card p-3 sm:p-4 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-all',
        onClick && 'cursor-pointer hover:border-aria-500/40',
      )}
    >
      <div className={clsx('p-2 sm:p-2.5 rounded-lg border shrink-0', colorMap[color])}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-slate-100 leading-none mt-0.5">{value}</p>
        {sub && <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">{sub}</p>}
      </div>
    </button>
  )
}

// ── Resource Bar ──────────────────────────────────────────────────────────────

function ResourceBar({ label, value, icon: Icon }) {
  const color = value > 90 ? 'bg-red-500' : value > 70 ? 'bg-yellow-500' : 'bg-aria-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Icon size={12} /> {label}
        </span>
        <span className={clsx('font-mono font-medium text-xs', value > 90 ? 'text-red-400' : 'text-slate-300')}>
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
  const statusColor = { done: 'text-green-400', pending: 'text-yellow-400', error: 'text-red-400' }[status] ?? 'text-slate-400'
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-surface-border last:border-0">
      <span className="text-sm w-4 text-center shrink-0">{icon}</span>
      <span className="flex-1 text-xs sm:text-sm text-slate-300 truncate">{label}</span>
      <span className={clsx('text-[10px] sm:text-xs font-mono shrink-0', statusColor)}>{time}</span>
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
        // Mock for web/Android
        setStats({
          cpu:  Math.round(Math.random() * 30 + 10),
          ram:  Math.round(Math.random() * 25 + 35),
          disk: 58,
          temp: null, // not available on Android
        })
      }
    }
    refresh()
    id = setInterval(refresh, 10_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const MOCK_ACTIVITY = [
    { icon: '✅', label: 'ARIA inicializada com Gemini', time: 'Agora',  status: 'done'    },
    { icon: '🤖', label: 'Motor: Gemini 1.5 Flash',      time: 'Ativo', status: 'done'    },
    { icon: '⚡', label: 'Configure email para emails',   time: 'Pend.', status: 'pending' },
    { icon: '💾', label: 'Configure integrações',         time: 'Pend.', status: 'pending' },
  ]

  return (
    <div className="space-y-3 sm:space-y-5 max-w-6xl mx-auto">
      {/* Hero greeting */}
      <div className="card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-aria-900/40 to-surface-card">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-aria-600 flex items-center justify-center text-xl sm:text-2xl shrink-0">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-100">{greeting}!</h2>
          <p className="text-xs sm:text-sm text-slate-400 truncate">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <Zap size={11} className="text-aria-400" />
          <span>Gemini</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <StatCard icon={MessageSquare}  label="Chat IA"          value="Ativo"  sub="Gemini 1.5 Flash"    color="aria"   onClick={() => onNavigate('chat')} />
        <StatCard icon={CalendarDays}   label="Compromissos"     value="—"      sub="Conecte calendário"  color="blue"   onClick={() => onNavigate('calendar')} />
        <StatCard icon={TrendingUp}     label="Contas pendentes" value="0"      sub="Próx. 7 dias"        color="yellow" onClick={() => onNavigate('financial')} />
        <StatCard icon={CheckCircle}    label="Tarefas"          value="0"      sub="Pendentes"           color="green"  onClick={() => onNavigate('chat')} />
      </div>

      {/* Resources (desktop) */}
      <div className="card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs sm:text-sm text-slate-200">Recursos do Dispositivo</h3>
          <button onClick={() => onNavigate('system')} className="btn-ghost py-1 px-2 text-xs hidden sm:flex">
            Ver tudo <ArrowRight size={11} />
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

      {/* Activity */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-xs sm:text-sm text-slate-200">Atividade Recente</h3>
          <button onClick={() => onNavigate('logs')} className="btn-ghost py-1 px-2 text-xs hidden sm:flex">
            Logs <ArrowRight size={11} />
          </button>
        </div>
        {MOCK_ACTIVITY.map((a, i) => <ActivityItem key={i} {...a} />)}
      </div>

      {/* CTA */}
      <div className="card p-3 sm:p-4 flex items-start gap-2.5 border-aria-500/20 bg-aria-500/5">
        <AlertTriangle size={14} className="text-aria-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-aria-300">Configure integrações para mais recursos</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
            Conecte email e calendário para ativar automações completas.
          </p>
        </div>
        <button onClick={() => onNavigate('settings')} className="btn-ghost py-1 px-2 text-xs shrink-0">
          Config
        </button>
      </div>
    </div>
  )
}
