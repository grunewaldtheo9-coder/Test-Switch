import React, { useState } from 'react'
import { Mail, Star, Paperclip, RefreshCw, Search, Filter, Send, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const MOCK_EMAILS = [
  { id: 1, from: 'João Silva', email: 'joao@empresa.com',    subject: 'Orçamento para projeto website',  date: '10:42', read: false, priority: 'high',   hasAttachment: true  },
  { id: 2, from: 'Maria Costa', email: 'maria@cliente.com', subject: 'Re: Reunião de segunda-feira',     date: '09:15', read: false, priority: 'normal', hasAttachment: false },
  { id: 3, from: 'Banco XYZ',   email: 'noreply@bancoxyz',  subject: 'Seu extrato de maio está pronto', date: '08:00', read: true,  priority: 'normal', hasAttachment: true  },
  { id: 4, from: 'Carlos Dev',  email: 'carlos@dev.io',     subject: 'Deploy finalizado em produção',   date: 'Ontem', read: true,  priority: 'normal', hasAttachment: false },
  { id: 5, from: 'RH Interno',  email: 'rh@empresa.com',    subject: 'Lembrete: férias coletivas julho', date: 'Ontem', read: true, priority: 'normal', hasAttachment: false },
]

export default function EmailPanel({ addNotification }) {
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')
  const [compose,  setCompose]  = useState(false)
  const [draft,    setDraft]    = useState({ to: '', subject: '', body: '' })

  const filtered = MOCK_EMAILS.filter(
    (e) =>
      e.from.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()),
  )

  function handleSend() {
    addNotification?.({
      type: 'warning',
      title: 'Confirmação necessária',
      body: `Enviar email para "${draft.to}"? (Nível 3 — confirmação explícita)`,
    })
    setCompose(false)
    setDraft({ to: '', subject: '', body: '' })
  }

  return (
    <div className="flex h-full gap-4 max-w-6xl mx-auto">
      {/* Email list */}
      <div className={clsx('card flex flex-col', selected ? 'w-80 shrink-0' : 'flex-1')}>
        <div className="p-4 border-b border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-200">Caixa de Entrada</h2>
            <div className="flex gap-1">
              <button className="btn-ghost p-2"><RefreshCw size={14} /></button>
              <button onClick={() => setCompose(true)} className="btn-primary py-1.5 px-3 text-xs">
                <Send size={12} /> Novo
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-8"
              placeholder="Pesquisar emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-surface-border">
          {filtered.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelected(email.id === selected ? null : email.id)}
              className={clsx(
                'w-full text-left px-4 py-3 hover:bg-surface-elevated transition-colors',
                selected === email.id && 'bg-aria-600/10 border-l-2 border-aria-500',
                !email.read && 'bg-surface-elevated/50',
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={clsx('text-sm truncate', !email.read ? 'font-semibold text-slate-100' : 'text-slate-300')}>
                  {email.from}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {email.priority === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                  {email.hasAttachment && <Paperclip size={11} className="text-slate-500" />}
                  <span className="text-xs text-slate-500">{email.date}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 truncate">{email.subject}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Email detail */}
      {selected && (
        <div className="card flex-1 p-5 space-y-4 animate-fade-in overflow-y-auto">
          {(() => {
            const email = MOCK_EMAILS.find((e) => e.id === selected)
            if (!email) return null
            return (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base">{email.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1">De: {email.from} &lt;{email.email}&gt;</p>
                  </div>
                  {email.priority === 'high' && (
                    <span className="badge-high flex items-center gap-1">
                      <AlertCircle size={10} /> Urgente
                    </span>
                  )}
                </div>
                <div className="border border-surface-border rounded-lg p-4 text-sm text-slate-300 leading-relaxed bg-surface-elevated min-h-32">
                  <p className="text-slate-500 italic text-xs">[Corpo do email apareceria aqui após conectar conta real]</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDraft({ to: email.email, subject: `Re: ${email.subject}`, body: '' })
                      setCompose(true)
                    }}
                    className="btn-primary text-sm"
                  >
                    <Send size={13} /> Responder
                  </button>
                  <button className="btn-ghost text-sm">
                    <Star size={13} /> Marcar
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4">
          <div className="card w-full max-w-lg p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100">Novo Email</h3>
              <button onClick={() => setCompose(false)} className="btn-ghost p-1 text-xs">✕</button>
            </div>
            <input className="input" placeholder="Para" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
            <input className="input" placeholder="Assunto" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            <textarea
              className="input min-h-32 resize-none"
              placeholder="Mensagem..."
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
            <div className="flex items-center gap-2 justify-end">
              <div className="flex items-center gap-1.5 text-xs text-yellow-400 mr-auto">
                <AlertCircle size={12} />
                <span>Requer confirmação (Nível 3)</span>
              </div>
              <button onClick={() => setCompose(false)} className="btn-ghost">Cancelar</button>
              <button onClick={handleSend} className="btn-primary">
                <Send size={14} /> Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
