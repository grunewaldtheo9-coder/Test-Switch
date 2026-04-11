import React, { useState } from 'react'
import { Bot, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import clsx from 'clsx'

const STEPS = [
  { id: 'welcome',  title: 'Bem-vindo à ARIA',          subtitle: 'Vamos configurar sua assistente executiva virtual' },
  { id: 'profile',  title: 'Seu Perfil',                 subtitle: 'Conta-me um pouco sobre você' },
  { id: 'hours',    title: 'Horário de Trabalho',         subtitle: 'Quando você costuma trabalhar?' },
  { id: 'routines', title: 'Rotinas Automáticas',         subtitle: 'Ative as automações que deseja usar' },
  { id: 'done',     title: 'ARIA pronta para trabalhar!', subtitle: 'Tudo configurado — pode começar' },
]

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    user:     { name: '', profession: '', company: '', language: 'pt-BR' },
    workHours:{ start: '08:00', end: '18:00' },
    routines: { morningEnabled: true, morningTime: '08:00', eveningEnabled: true, eveningTime: '18:00', weeklyEnabled: true, monthlyEnabled: true },
  })

  function next() { if (step < STEPS.length - 1) setStep((s) => s + 1) }
  function prev() { if (step > 0) setStep((s) => s - 1) }

  const { id, title, subtitle } = STEPS[step]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-0 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-aria-900 to-surface-card p-6 border-b border-surface-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-aria-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100">{title}</h2>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={clsx('flex-1 h-1 rounded-full transition-colors', i <= step ? 'bg-aria-500' : 'bg-surface-elevated')} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-48">
          {id === 'welcome' && (
            <div className="text-center space-y-3 py-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                A ARIA é sua assistente executiva virtual completa. Ela gerencia emails,
                calendário, arquivos, finanças e muito mais — tudo diretamente no seu computador.
              </p>
              <div className="grid grid-cols-2 gap-2 text-left mt-4">
                {['Email & Agenda', 'Arquivos', 'Financeiro', 'Automações', 'Diagnóstico PC', 'Chat com IA'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                    <Check size={12} className="text-aria-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {id === 'profile' && (
            <div className="space-y-3">
              <input className="input" placeholder="Seu nome completo *" value={data.user.name}
                onChange={(e) => setData({ ...data, user: { ...data.user, name: e.target.value } })} />
              <input className="input" placeholder="Profissão / Área de atuação" value={data.user.profession}
                onChange={(e) => setData({ ...data, user: { ...data.user, profession: e.target.value } })} />
              <input className="input" placeholder="Empresa (opcional)" value={data.user.company}
                onChange={(e) => setData({ ...data, user: { ...data.user, company: e.target.value } })} />
            </div>
          )}

          {id === 'hours' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Início</label>
                  <input type="time" className="input" value={data.workHours.start}
                    onChange={(e) => setData({ ...data, workHours: { ...data.workHours, start: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Fim</label>
                  <input type="time" className="input" value={data.workHours.end}
                    onChange={(e) => setData({ ...data, workHours: { ...data.workHours, end: e.target.value } })} />
                </div>
              </div>
            </div>
          )}

          {id === 'routines' && (
            <div className="space-y-3">
              {[
                { key: 'morningEnabled',  label: 'Rotina Matinal (resumo do dia)' },
                { key: 'eveningEnabled',  label: 'Rotina de Encerramento (backup + tarefas)' },
                { key: 'weeklyEnabled',   label: 'Relatório Semanal' },
                { key: 'monthlyEnabled',  label: 'Relatório Mensal' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <button
                    onClick={() => setData({ ...data, routines: { ...data.routines, [key]: !data.routines[key] } })}
                    className={clsx('w-8 h-4.5 rounded-full transition-colors', data.routines[key] ? 'bg-aria-600' : 'bg-surface-border')}
                    style={{ height: '18px' }}
                  >
                    <span className={clsx('block w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mx-0.5', data.routines[key] ? 'translate-x-3.5' : 'translate-x-0')} />
                  </button>
                  <span className="text-sm text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          )}

          {id === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                <Check size={28} className="text-green-400" />
              </div>
              <div>
                <p className="text-slate-200 font-medium">
                  {data.user.name ? `Olá, ${data.user.name.split(' ')[0]}!` : 'Tudo pronto!'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  A ARIA está configurada e pronta. Configure suas integrações (email, calendário) em <strong className="text-slate-400">Configurações → Integrações</strong> para liberar todo o potencial.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-surface-border">
          <button onClick={prev} disabled={step === 0} className="btn-ghost disabled:opacity-30">
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="text-xs text-slate-600">{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary">
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={() => onComplete(data)} className="btn-primary bg-green-600 hover:bg-green-500">
              <Check size={16} /> Começar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
