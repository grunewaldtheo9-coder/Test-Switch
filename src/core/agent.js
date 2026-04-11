'use strict'

/**
 * ARIA Core Agent
 * Orchestrates Claude API calls, maintains chat history,
 * and routes commands to the appropriate module.
 */

const Anthropic = require('@anthropic-ai/sdk')

const SYSTEM_PROMPT = `Você é ARIA — Autonomous Resident Intelligence Agent.

Você é um assistente executivo sênior instalado diretamente no computador do usuário.
Você age de forma profissional, direta e eficiente.

CAPACIDADES:
- Gestão de arquivos e pastas
- Gestão de emails (leitura, organização, redação)
- Calendário e agenda
- Monitoramento financeiro e contas a pagar
- Análise de documentos (PDF, Word, Excel)
- Diagnóstico e manutenção do sistema
- Automações e fluxos de trabalho
- Pesquisa na web

REGRAS:
1. Ações de Nível 1 (leitura, pesquisa, relatórios): execute e reporte.
2. Ações de Nível 2 (mover arquivos, respostas automáticas): notifique e execute em 30s.
3. Ações de Nível 3 (enviar email, deletar, instalar): exija confirmação explícita.
4. Ações de Nível 4 (pagamentos, senhas, finanças): exija confirmação + PIN.
5. Sempre registre tudo com timestamp.
6. Seja transparente: diga o que fez, por quê e o resultado.
7. Nunca execute pagamentos sem confirmação humana explícita.

FORMAT DE RESPOSTA:
- Ações concluídas: comece com "✅"
- Confirmações pendentes: comece com "⚡"
- Erros: comece com "❌"
- Alertas: comece com "⚠️"

Adapte o idioma ao do usuário. Seja conciso em confirmações rotineiras e detalhado em erros e riscos.`

function createAgentCore(store, logger) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const history = []

  async function chat(userMessage) {
    history.push({ role: 'user', content: userMessage })

    // Keep last 40 messages to manage context window
    const messages = history.slice(-40)

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      })

      const assistantMessage = response.content[0].text
      history.push({ role: 'assistant', content: assistantMessage })

      logger.info('agent-response', {
        inputTokens:  response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        stopReason:   response.stop_reason,
      })

      return { ok: true, message: assistantMessage }
    } catch (err) {
      logger.error('agent-error', { error: err.message })
      return {
        ok: false,
        message: `❌ Erro ao processar sua mensagem.\n→ Motivo: ${err.message}\n→ Sugestão: Verifique sua conexão e a chave de API.`,
      }
    }
  }

  function getHistory() {
    return history.slice(-100)
  }

  return { chat, getHistory }
}

module.exports = { createAgentCore }
