/**
 * ARIA — Gemini AI Service
 * Replaces Claude API with Google Gemini (free tier).
 *
 * Model: gemini-1.5-flash  (free, 15 RPM, 1M tokens/day)
 *
 * ⚠️  API key is embedded for APK convenience.
 *     For production distribution, proxy through a backend.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Config ────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = 'AIzaSyAM4k_tgGradQQ3mDIGyBgJoKl6jzKt8jU'
const MODEL_NAME     = 'gemini-1.5-flash'

const ARIA_SYSTEM = `Você é ARIA — Autonomous Resident Intelligence Agent.

Você é uma assistente executiva virtual de nível profissional instalada diretamente no dispositivo do usuário. Você é capaz, proativa e extremamente eficiente.

PERSONALIDADE:
- Profissional, direta e eficiente
- Antecipa necessidades do usuário
- Responde em português por padrão (adapta ao idioma do usuário)
- Concisa em rotinas, detalhada em riscos/erros
- Nunca age de forma negligente com dados sensíveis

CAPACIDADES:
• Gestão de emails, calendário e agenda
• Organização de arquivos e documentos
• Monitoramento financeiro e contas a pagar
• Diagnóstico e manutenção do sistema
• Pesquisa e análise de informações
• Criação de documentos, relatórios e planilhas
• Automações e fluxos de trabalho personalizados
• Gestão de projetos e tarefas

FORMATO DE RESPOSTA:
- ✅ para ações concluídas
- ⚡ para confirmações pendentes
- ❌ para erros
- ⚠️ para alertas importantes

REGRAS ABSOLUTAS:
1. Nunca realize pagamentos sem confirmação explícita do usuário
2. Nunca delete arquivos permanentemente sem confirmação
3. Sempre registre ações importantes com timestamp
4. Em caso de dúvida, pergunte antes de agir
5. Seja transparente: diga o que fez, por quê e o resultado`

// ── State ─────────────────────────────────────────────────────────────────────

let chatSession  = null
const history    = []

// ── Gemini instance ───────────────────────────────────────────────────────────

function getModel() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: ARIA_SYSTEM,
    generationConfig: {
      temperature:     0.8,
      topK:            40,
      topP:            0.95,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a message to ARIA (Gemini-powered).
 * Maintains full conversation history within the session.
 */
export async function sendMessage(userMessage) {
  // Build Gemini-format history (exclude last user message, it's passed to sendMessage)
  const geminiHistory = history.map((m) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  // Re-create the chat session with current history on each call
  // (Gemini SDK stateless approach — avoids session expiry issues)
  const session = getModel().startChat({ history: geminiHistory })

  history.push({ role: 'user', content: userMessage })

  try {
    const result = await session.sendMessage(userMessage)
    const text   = result.response.text()

    history.push({ role: 'assistant', content: text })

    // Trim history to last 60 messages to manage memory
    if (history.length > 60) history.splice(0, history.length - 60)

    return { ok: true, message: text }
  } catch (err) {
    const msg = buildErrorMessage(err)
    return { ok: false, message: msg }
  }
}

/** Returns a copy of the current conversation history. */
export function getHistory() {
  return [...history]
}

/** Clears the conversation history and session. */
export function clearHistory() {
  chatSession = null
  history.length = 0
}

// ── Error helpers ─────────────────────────────────────────────────────────────

function buildErrorMessage(err) {
  const msg = err?.message ?? String(err)

  if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
    return '❌ Chave de API inválida.\n→ Verifique a chave Gemini nas Configurações.'
  }
  if (msg.includes('QUOTA_EXCEEDED') || msg.includes('429')) {
    return '⚠️ Limite de requisições atingido (free tier).\n→ Aguarde um momento e tente novamente.'
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
    return '❌ Sem conexão com a internet.\n→ Verifique sua conexão e tente novamente.'
  }
  return `❌ Erro ao processar mensagem.\n→ Motivo: ${msg}`
}

// ── Quick command handler ────────────────────────────────────────────��────────

/**
 * Handles built-in quick commands before sending to Gemini.
 * Returns a local response string or null (let Gemini handle it).
 */
export function quickReply(cmd) {
  const c = cmd.toLowerCase().trim()

  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (c === 'status' || c === 'status aria') {
    return `✅ ARIA online e funcionando\n→ Horário: ${timeStr}\n→ Data: ${dateStr}\n→ Motor: Gemini 1.5 Flash\n→ Histórico: ${history.length} mensagens`
  }
  if (c === 'limpar' || c === 'clear') {
    clearHistory()
    return '✅ Histórico de conversa limpo.'
  }

  return null // Let Gemini handle everything else
}
