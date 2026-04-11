import React, { useState, useEffect } from 'react'
import { Cpu, MemoryStick, HardDrive, Thermometer, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

function GaugeCard({ label, value, unit = '%', icon: Icon, threshold, color }) {
  const pct = unit === '%' ? value : Math.min(100, (value / threshold) * 100)
  const c = pct > 90 ? 'red' : pct > 70 ? 'yellow' : color ?? 'aria'
  const colorMap = {
    aria:   { bar: 'bg-aria-500',   text: 'text-aria-400',   ring: 'ring-aria-500/20'   },
    green:  { bar: 'bg-green-500',  text: 'text-green-400',  ring: 'ring-green-500/20'  },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/20' },
    red:    { bar: 'bg-red-500',    text: 'text-red-400',    ring: 'ring-red-500/20'    },
  }
  const { bar, text } = colorMap[c]

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Icon size={15} className={text} /> {label}
        </div>
        <span className={clsx('text-lg font-bold font-mono', text)}>
          {value !== null ? `${value}${unit}` : '—'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-700', bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const MOCK_PROCESSES = [
  { name: 'node',      pid: 1234, cpu: 12.3, mem: 8.1  },
  { name: 'electron',  pid: 5678, cpu:  4.1, mem: 15.3 },
  { name: 'chrome',    pid: 9012, cpu:  3.8, mem: 22.7 },
  { name: 'vscode',    pid: 3456, cpu:  2.1, mem: 12.4 },
  { name: 'python',    pid: 7890, cpu:  1.9, mem:  4.3 },
]

const MOCK_ALERTS = [
  { type: 'ok',      message: 'CPU temperatura normal: 58°C'   },
  { type: 'ok',      message: 'RAM dentro do esperado: 54%'    },
  { type: 'warning', message: 'Disco com 68% de uso — atenção' },
  { type: 'ok',      message: 'Sem processos suspeitos detectados' },
]

export default function SystemPanel() {
  const [stats,      setStats]      = useState({ cpu: 0, ram: 0, disk: 0, temp: null })
  const [processes,  setProcesses]  = useState(MOCK_PROCESSES)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => { refresh() }, [])

  async function refresh() {
    setLoading(true)
    if (window.aria) {
      const s = await window.aria.getSystemStats()
      setStats(s)
    } else {
      setStats({
        cpu:  Math.round(Math.random() * 40 + 10),
        ram:  Math.round(Math.random() * 30 + 40),
        disk: 68,
        temp: 58,
      })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Diagnóstico do Sistema</h2>
        <button onClick={refresh} disabled={loading} className="btn-ghost text-xs gap-1.5">
          <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GaugeCard label="CPU"          value={stats.cpu}  icon={Cpu}         color="aria"  />
        <GaugeCard label="RAM"          value={stats.ram}  icon={MemoryStick} color="green" />
        <GaugeCard label="Disco"        value={stats.disk} icon={HardDrive}   color="aria"  />
        <GaugeCard label="Temperatura"  value={stats.temp} unit="°C" threshold={100} icon={Thermometer} color="green" />
      </div>

      {/* Health alerts */}
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-slate-200">Alertas de Saúde</h3>
        {MOCK_ALERTS.map((a, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            {a.type === 'ok'
              ? <CheckCircle size={14} className="text-green-400 shrink-0" />
              : <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
            }
            <span className={a.type === 'ok' ? 'text-slate-400' : 'text-yellow-300'}>{a.message}</span>
          </div>
        ))}
      </div>

      {/* Processes */}
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-slate-200">Top Processos (CPU)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-surface-border">
                <th className="text-left py-2 pr-4 font-medium">Processo</th>
                <th className="text-left py-2 pr-4 font-medium">PID</th>
                <th className="text-right py-2 pr-4 font-medium">CPU %</th>
                <th className="text-right py-2 font-medium">RAM %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {processes.map((p) => (
                <tr key={p.pid} className="hover:bg-surface-elevated/50">
                  <td className="py-2.5 pr-4 font-mono text-slate-300">{p.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{p.pid}</td>
                  <td className={clsx('py-2.5 pr-4 text-right font-mono', p.cpu > 20 ? 'text-red-400' : 'text-slate-300')}>
                    {p.cpu.toFixed(1)}
                  </td>
                  <td className={clsx('py-2.5 text-right font-mono', p.mem > 20 ? 'text-yellow-400' : 'text-slate-300')}>
                    {p.mem.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
