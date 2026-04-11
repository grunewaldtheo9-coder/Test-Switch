import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Zap, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

const QUICK_COMMANDS = [
  'Resumo do dia',
  'Verificar emails',
  'Agenda de hoje',
  'Status financeiro',
  'Diagnóstico do sistema',
  'O que está pendente?',
]

function Message({ role, content, loading }) {
  const isUser = role === 'user'

  return (
    <div className={clsx('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-aria-600' : 'bg-surface-elevated border border-surface-border',
      )}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-aria-400" />}
      </div>

      <div className={clsx(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-aria-600 text-white rounded-tr-sm'
          : 'bg-surface-elevated border border-surface-border text-slate-200 rounded-tl-sm',
      )}>
        {loading
          ? <Loader2 size={14} className="animate-spin text-slate-400" />
          : <p className="whitespace-pre-wrap">{content}</p>
        }
      </div>
    </div>
  )
}

const INITIAL_MSG = {
  role: 'assistant',
  content: `Olá! Sou a ARIA — sua assistente executiva virtual. 🤖

Posso ajudar com:
• Gestão de emails e agenda
• Organização de arquivos
• Análise financeira
• Diagnóstico do sistema
• Automações e relatórios

Como posso ajudá-lo hoje?`,
}

export default function ChatPanel({ addNotification }) {
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const msg = text ?? input.trim()
    if (!msg) return

    setInput('')
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setLoading(true)

    try {
      let reply
      if (window.aria) {
        const res = await window.aria.sendMessage(msg)
        reply = res.message
      } else {
        await new Promise((r) => setTimeout(r, 1200))
        reply = `✅ Entendido!\n\nRecebí sua solicitação: "${msg}"\n\nNota: A ARIA está rodando em modo de pré-visualização. Conecte a chave de API Anthropic nas Configurações para ativar respostas inteligentes completas.`
      }
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '❌ Erro ao processar. Verifique a configuração da API.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function clearHistory() {
    setMessages([INITIAL_MSG])
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto gap-3">
      {/* Quick commands */}
      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => send(cmd)}
            className="text-xs px-3 py-1.5 rounded-full border border-surface-border text-slate-400
                       hover:border-aria-500/50 hover:text-aria-400 transition-colors bg-surface-elevated"
          >
            {cmd}
          </button>
        ))}
        <button
          onClick={clearHistory}
          className="text-xs px-3 py-1.5 rounded-full border border-surface-border text-slate-500
                     hover:text-slate-300 transition-colors flex items-center gap-1.5 bg-surface-elevated"
        >
          <RotateCcw size={10} /> Limpar
        </button>
      </div>

      {/* Messages */}
      <div className="card flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <Message key={i} {...m} />
        ))}
        {loading && <Message role="assistant" content="" loading />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          className="flex-1 bg-transparent resize-none text-sm text-slate-200 placeholder-slate-500
                     focus:outline-none leading-relaxed min-h-[40px] max-h-32"
          placeholder="Digite um comando ou pergunta para ARIA..."
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="btn-primary p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      <p className="text-center text-xs text-slate-600">
        <Zap size={10} className="inline mb-0.5 text-aria-500" /> ARIA v1.0 · Powered by Claude
      </p>
    </div>
  )
}
