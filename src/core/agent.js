'use strict'

/**
 * ARIA Core Agent — Node.js (Electron/Desktop)
 * Uses Google Gemini API via REST for the main process.
 * The renderer process uses src/services/gemini.js directly.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAM4k_tgGradQQ3mDIGyBgJoKl6jzKt8jU'
const MODEL          = 'gemini-1.5-flash'
const API_URL        = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `Você é ARIA — Autonomous Resident Intelligence Agent.

Você é uma assistente executiva virtual de nível profissional instalada diretamente no computador do usuário.

Aja com a mentalidade de um assistente executivo sênior altamente treinado:
- Conhece profundamente o fluxo de trabalho do usuário
- Antecipa necessidades antes de serem expressas
- Executa tarefas complexas de ponta a ponta
- Reporta progresso, riscos e conclusões de forma clara
- Nunca age de forma negligente com dados sensíveis
- Pede confirmação antes de ações irreversíveis de alto impacto

FORMATO DE RESPOSTA:
- ✅ para ações concluídas
- ⚡ para confirmações pendentes
- ❌ para erros
- ⚠️ para alertas

Comunique-se em português do Brasil. Seja conciso em confirmações e detalhado em riscos.`

function createAgentCore(store, logger) {
  const history = []

  async function chat(userMessage) {
    history.push({ role: 'user', parts: [{ text: userMessage }] })

    // Keep last 40 turns
    const contents = history.slice(-40)

    try {
      const response = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature:     0.8,
            maxOutputTokens: 2048,
            topP:            0.95,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `HTTP ${response.status}`)
      }

      const data    = await response.json()
      const text    = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '(sem resposta)'

      history.push({ role: 'model', parts: [{ text }] })

      logger.info('agent-response', {
        inputTokens:  data?.usageMetadata?.promptTokenCount,
        outputTokens: data?.usageMetadata?.candidatesTokenCount,
      })

      return { ok: true, message: text }
    } catch (err) {
      logger.error('agent-error', { error: err.message })

      const msg = err.message?.includes('429')
        ? '⚠️ Limite de requisições Gemini atingido.\n→ Aguarde um momento e tente novamente.'
        : `❌ Erro ao processar sua mensagem.\n→ Motivo: ${err.message}`

      return { ok: false, message: msg }
    }
  }

  function getHistory() {
    return history.slice(-100).map((m) => ({
      role:    m.role === 'model' ? 'assistant' : 'user',
      content: m.parts?.[0]?.text ?? '',
    }))
  }

  return { chat, getHistory }
}

module.exports = { createAgentCore }
