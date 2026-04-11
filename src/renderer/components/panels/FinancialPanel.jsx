import React, { useState } from 'react'
import {
  TrendingUp, TrendingDown, AlertTriangle, Plus, DollarSign,
  Calendar, CheckCircle, Circle, PieChart,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import clsx from 'clsx'

const MOCK_BILLS = [
  { id: 1, description: 'Aluguel',          amount: 2500, dueDate: '2026-04-15', beneficiary: 'Imobiliária ABC', paid: false },
  { id: 2, description: 'Internet',          amount: 120,  dueDate: '2026-04-18', beneficiary: 'Operadora XYZ',  paid: false },
  { id: 3, description: 'Energia Elétrica', amount: 280,  dueDate: '2026-04-20', beneficiary: 'Concessionária', paid: false },
  { id: 4, description: 'Plano de Saúde',   amount: 450,  dueDate: '2026-04-10', beneficiary: 'Unimed',         paid: true  },
]

const MOCK_CHART = [
  { name: 'Jan', receitas: 8500, despesas: 5200 },
  { name: 'Fev', receitas: 9200, despesas: 6100 },
  { name: 'Mar', receitas: 7800, despesas: 5400 },
  { name: 'Abr', receitas: 10500, despesas: 6800 },
]

const MOCK_CATEGORIES = [
  { name: 'Moradia',      value: 2780, color: '#4f5fff' },
  { name: 'Alimentação',  value: 1200, color: '#22c55e' },
  { name: 'Transporte',   value: 650,  color: '#eab308' },
  { name: 'Saúde',        value: 450,  color: '#ec4899' },
  { name: 'Outros',       value: 720,  color: '#94a3b8' },
]

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function FinancialPanel({ addNotification }) {
  const [bills, setBills]       = useState(MOCK_BILLS)
  const [showAdd, setShowAdd]   = useState(false)
  const [newBill, setNewBill]   = useState({ description: '', amount: '', dueDate: '', beneficiary: '' })

  const pending = bills.filter((b) => !b.paid)
  const totalPending = pending.reduce((s, b) => s + b.amount, 0)

  function togglePaid(id) {
    addNotification?.({
      type: 'warning',
      title: 'Confirmação necessária',
      body: 'Registrar pagamento? Esta ação é Nível 3 — requer confirmação explícita.',
    })
  }

  const dueSoon = bills.filter((b) => {
    if (b.paid) return false
    const days = (new Date(b.dueDate) - Date.now()) / 86_400_000
    return days <= 7
  })

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Receitas (Abr)', value: fmt(10500),  icon: TrendingUp,   color: 'green' },
          { label: 'Despesas (Abr)', value: fmt(6800),   icon: TrendingDown, color: 'red'   },
          { label: 'Saldo Líquido', value: fmt(3700),    icon: DollarSign,   color: 'aria'  },
          { label: 'Contas Pendentes', value: fmt(totalPending), icon: AlertTriangle, color: 'yellow' },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorMap = {
            green:  'text-green-400  bg-green-500/10  border-green-500/20',
            red:    'text-red-400    bg-red-500/10    border-red-500/20',
            aria:   'text-aria-400   bg-aria-500/10   border-aria-500/20',
            yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
          }
          return (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={clsx('p-2.5 rounded-lg border shrink-0', colorMap[color])}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-100">{value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      {dueSoon.length > 0 && (
        <div className="card p-4 border-yellow-500/20 bg-yellow-500/5 flex items-center gap-3">
          <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-300">
            <strong>{dueSoon.length} conta(s)</strong> vencendo nos próximos 7 dias — total {fmt(dueSoon.reduce((s, b) => s + b.amount, 0))}
          </p>
        </div>
      )}

      {/* Charts + Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">Receitas vs Despesas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_CHART} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2d40', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => fmt(v)}
              />
              <Bar dataKey="receitas" fill="#4f5fff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-sm text-slate-200">Gastos por Categoria</h3>
          <div className="space-y-2.5">
            {MOCK_CATEGORIES.map((c) => {
              const total = MOCK_CATEGORIES.reduce((s, x) => s + x.value, 0)
              const pct = Math.round((c.value / total) * 100)
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-mono">{fmt(c.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bills list */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">Contas a Pagar</h3>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
            <Plus size={13} /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {bills.map((bill) => {
            const daysLeft = Math.ceil((new Date(bill.dueDate) - Date.now()) / 86_400_000)
            const isOverdue = daysLeft < 0
            return (
              <div key={bill.id} className={clsx(
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                bill.paid ? 'border-surface-border opacity-50' : isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-surface-border bg-surface-elevated/50',
              )}>
                <button onClick={() => togglePaid(bill.id)} className="shrink-0">
                  {bill.paid ? <CheckCircle size={16} className="text-green-400" /> : <Circle size={16} className="text-slate-500" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm font-medium truncate', bill.paid ? 'line-through text-slate-500' : 'text-slate-200')}>
                    {bill.description}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(bill.dueDate).toLocaleDateString('pt-BR')} · {bill.beneficiary}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-200">{fmt(bill.amount)}</p>
                  {!bill.paid && (
                    <p className={clsx('text-xs', isOverdue ? 'text-red-400' : daysLeft <= 3 ? 'text-yellow-400' : 'text-slate-500')}>
                      {isOverdue ? `${Math.abs(daysLeft)}d atrasado` : `${daysLeft}d restantes`}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add bill modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
          <div className="card w-full max-w-md p-5 space-y-4 animate-slide-up">
            <h3 className="font-semibold text-slate-100">Nova Conta</h3>
            <input className="input" placeholder="Descrição" value={newBill.description} onChange={(e) => setNewBill({ ...newBill, description: e.target.value })} />
            <input className="input" type="number" placeholder="Valor (R$)" value={newBill.amount} onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })} />
            <input className="input" type="date" value={newBill.dueDate} onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })} />
            <input className="input" placeholder="Beneficiário" value={newBill.beneficiary} onChange={(e) => setNewBill({ ...newBill, beneficiary: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancelar</button>
              <button
                onClick={() => {
                  setBills((b) => [...b, { ...newBill, id: Date.now(), amount: parseFloat(newBill.amount), paid: false }])
                  addNotification?.({ type: 'success', title: 'Conta adicionada!', body: newBill.description })
                  setShowAdd(false)
                  setNewBill({ description: '', amount: '', dueDate: '', beneficiary: '' })
                }}
                className="btn-primary"
              >
                <Plus size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
