import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Zap, RotateCcw, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { sendMessage, getHistory, clearHistory, quickReply } from '../../../services/gemini.js'

const QUICK_COMMANDS = [
  { label: 'Resumo do dia',         cmd: 'Dê um resumo executivo do meu dia, com dicas de produtividade para hoje.' },
  { label: 'Status ARIA',           cmd: 'status' },
  { label: 'Organizar tarefas',     cmd: 'Me ajude a organizar minhas tarefas e prioridades para hoje.' },
  { label: 'Análise financeira',    cmd: 'Como posso melhorar minha gestão financeira pessoal e empresarial?' },
  { label: 'Modelo de email',       cmd: 'Crie um modelo de email profissional de acompanhamento para um cliente que não respondeu.' },
  { label: 'Dicas de produtividade',cmd: 'Dê 5 dicas práticas de produtividade para quem trabalha com tecnologia.' },
  { label: 'Relatório simples',     cmd: 'Como estruturar um relatório executivo mensal de resultados para minha empresa?' },
  { label: 'Limpar conversa',       cmd: 'limpar' },
]

function Message({ role, content, loading, isNew }) {
  const isUser = role === 'user'

  // Format lines with ARIA emoji markers
  const formattedContent = content
    ? content
        .replace(/^(✅|⚡|❌|⚠️)/m, (m) => m)
        .split('\n')
        .map((line, i) => <span key={i}>{line}<br /></span>)
    : null

  return (
    <div
      className={clsx(
        'flex gap-2.5 sm:gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
          isUser ? 'bg-aria-600' : 'bg-surface-elevated border border-surface-border',
        )}
      >
        {isUser
          ? <User size={13} className="text-white" />
          : <Bot size={13} className="text-aria-400" />
        }
      </div>

      {/* Bubble */}
      <div
        className={clsx(
          'max-w-[82%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-aria-600 text-white rounded-tr-sm'
            : 'bg-surface-elevated border border-surface-border text-slate-200 rounded-tl-sm',
          isNew && !isUser && 'ring-1 ring-aria-500/20',
        )}
      >
        {loading
          ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs">ARIA está pensando...</span>
            </div>
          )
          : <p className="whitespace-pre-wrap break-words">{formattedContent}</p>
        }
      </div>
    </div>
  )
}

const INITIAL_MSG = {
  role: 'assistant',
  content: `Olá! Sou a ARIA, sua assistente executiva virtual. ✨

Sou alimentada pelo Gemini 1.5 Flash da Google e posso ajudar com:

• Redigir emails e documentos profissionais
• Planejar sua agenda e prioridades
• Analisar dados financeiros e criar relatórios
• Responder dúvidas e pesquisar informações
• Criar automações e fluxos de trabalho
• Qualquer tarefa de produtividade executiva

Como posso ajudá-lo hoje?`,
}

export default function ChatPanel({ addNotification }) {
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [newIdx,   setNewIdx]   = useState(null)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    setInput('')

    // Check for local quick replies first
    const local = quickReply(msg)
    if (local) {
      setMessages((m) => [
        ...m,
        { role: 'user',      content: msg   },
        { role: 'assistant', content: local },
      ])
      setNewIdx((m) => m)
      return
    }

    setMessages((m) => [...m, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await sendMessage(msg)

      setMessages((m) => {
        const updated = [...m, { role: 'assistant', content: res.message }]
        setNewIdx(updated.length - 1)
        return updated
      })

      if (!res.ok) {
        addNotification?.({ type: 'error', title: 'Erro ARIA', body: 'Falha ao contactar Gemini.' })
      }
    } catch (err) {
      const errMsg = `❌ Erro inesperado.\n→ ${err.message}`
      setMessages((m) => [...m, { role: 'assistant', content: errMsg }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleClear() {
    clearHistory()
    setMessages([INITIAL_MSG])
    setNewIdx(null)
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto gap-2 sm:gap-3">

      {/* Header badge */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={13} className="text-aria-400" />
        <span className="text-xs text-slate-500">Powered by Gemini 1.5 Flash</span>
        <span className="ml-auto text-xs text-slate-600">{messages.length - 1} mensagens</span>
      </div>

      {/* Quick commands */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_COMMANDS.map(({ label, cmd }) => (
          <button
            key={label}
            onClick={() => send(cmd)}
            disabled={loading}
            className="text-xs px-2.5 py-1.5 rounded-full border border-surface-border text-slate-400
                       hover:border-aria-500/50 hover:text-aria-400 active:scale-95
                       transition-all bg-surface-elevated disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="card flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
        {messages.map((m, i) => (
          <Message key={i} {...m} isNew={i === newIdx} />
        ))}
        {loading && <Message role="assistant" content="" loading />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-2.5 sm:p-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          className="flex-1 bg-transparent resize-none text-sm text-slate-200 placeholder-slate-500
                     focus:outline-none leading-relaxed"
          style={{ minHeight: '40px', maxHeight: '128px' }}
          placeholder="Digite um comando ou pergunta para ARIA..."
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
          onKeyDown={onKey}
        />

        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={handleClear}
            title="Limpar conversa"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-surface-elevated transition-colors"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="btn-primary p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-600 pb-1">
        <Zap size={10} className="inline mb-0.5 text-aria-500" /> ARIA v1.0 · Gemini 1.5 Flash · Grátis
      </p>
    </div>
  )
}
