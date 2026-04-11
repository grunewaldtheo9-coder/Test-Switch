import React, { useState } from 'react'
import {
  User, Link, Bell, Shield, TrendingUp,
  Save, CheckCircle, Eye, EyeOff, Key, Sparkles,
} from 'lucide-react'
import clsx from 'clsx'

const SECTIONS = [
  { id: 'profile',      label: 'Perfil',       icon: User       },
  { id: 'ai',           label: 'IA & API',      icon: Sparkles   },
  { id: 'routines',     label: 'Rotinas',       icon: Bell       },
  { id: 'security',     label: 'Segurança',     icon: Shield     },
  { id: 'financial',    label: 'Financeiro',    icon: TrendingUp },
  { id: 'integrations', label: 'Integrações',   icon: Link       },
]

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs text-slate-500 uppercase tracking-wider font-medium">{title}</h3>
      <div className="card p-4 sm:p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, help, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {children}
      {help && <p className="text-xs text-slate-600">{help}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button
        onClick={() => onChange(!checked)}
        style={{ minWidth: '36px', height: '20px' }}
        className={clsx(
          'relative rounded-full transition-colors duration-200 mt-0.5',
          checked ? 'bg-aria-600' : 'bg-surface-border',
        )}
      >
        <span className={clsx(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )} />
      </button>
      <div>
        <span className="text-sm text-slate-300 group-hover:text-slate-200">{label}</span>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

function ApiKeyField({ label, defaultValue = '', help }) {
  const [show, setShow] = useState(false)
  const [val,  setVal]  = useState(defaultValue)
  return (
    <Field label={label} help={help}>
      <div className="relative">
        <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type={show ? 'text' : 'password'}
          className="input pl-8 pr-10 font-mono text-xs"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </Field>
  )
}

// ── Settings Panel ────────────────────────────────────────────────────────────

export default function SettingsPanel({ settings, addNotification }) {
  const [active, setActive] = useState('ai')
  const [saved,  setSaved]  = useState(false)

  const [profile, setProfile] = useState({
    name:       settings?.user?.name       ?? '',
    profession: settings?.user?.profession ?? '',
    company:    settings?.user?.company    ?? '',
    language:   settings?.user?.language   ?? 'pt-BR',
  })

  const [routines, setRoutines] = useState({
    morningEnabled: settings?.routines?.morningEnabled ?? true,
    morningTime:    settings?.routines?.morningTime    ?? '08:00',
    eveningEnabled: settings?.routines?.eveningEnabled ?? true,
    eveningTime:    settings?.routines?.eveningTime    ?? '18:00',
    weeklyEnabled:  settings?.routines?.weeklyEnabled  ?? true,
    monthlyEnabled: settings?.routines?.monthlyEnabled ?? true,
  })

  async function save() {
    const data = { user: profile, routines }
    if (window.aria) {
      await window.aria.saveSettings(data)
    } else {
      localStorage.setItem('aria_settings', JSON.stringify({ ...data, onboardingDone: true }))
    }
    setSaved(true)
    addNotification?.({ type: 'success', title: 'Configurações salvas!', body: 'Alterações aplicadas.' })
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-5xl mx-auto">
      {/* Section nav — horizontal scroll on mobile, vertical on desktop */}
      <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible sm:w-44 sm:shrink-0 pb-1 sm:pb-0">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors shrink-0 sm:shrink sm:w-full',
              active === id
                ? 'bg-aria-600/20 text-aria-400 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
            )}
          >
            <Icon size={14} />
            <span className="whitespace-nowrap sm:whitespace-normal">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 animate-fade-in">

        {active === 'ai' && (
          <Section title="IA & Chave de API">
            {/* Gemini key display — embedded */}
            <div className="p-3 rounded-xl border border-aria-500/30 bg-aria-500/5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={13} className="text-aria-400" />
                <span className="text-xs font-semibold text-aria-300">Gemini 1.5 Flash (Google AI)</span>
                <span className="badge-ok ml-auto">Ativo</span>
              </div>
              <p className="text-xs text-slate-500">
                Motor de IA gratuito com 15 req/min e 1 milhão de tokens/dia.
                Chave de API incorporada na aplicação.
              </p>
            </div>

            <ApiKeyField
              label="Chave Gemini (substituir)"
              defaultValue="AIzaSyAM4k_tgGradQQ3mDIGyBgJoKl6jzKt8jU"
              help="Substitua pela sua própria chave em aistudio.google.com para limites independentes."
            />

            <Field label="Modelo" help="gemini-1.5-flash é grátis e rápido. gemini-1.5-pro é mais preciso mas tem limites menores.">
              <select className="input">
                <option value="gemini-1.5-flash" selected>gemini-1.5-flash (grátis, rápido)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (mais preciso)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (novo)</option>
              </select>
            </Field>

            <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-300">
              <p className="font-medium mb-1">⚠️ Aviso de segurança</p>
              <p className="text-yellow-400/80">
                A chave de API está incorporada no APK. Para uso pessoal isso é OK,
                mas não distribua publicamente — a chave pode ser extraída do arquivo.
              </p>
            </div>
          </Section>
        )}

        {active === 'profile' && (
          <Section title="Perfil do Usuário">
            <Field label="Nome completo">
              <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="Profissão / Área de atuação">
              <input className="input" value={profile.profession} onChange={(e) => setProfile({ ...profile, profession: e.target.value })} />
            </Field>
            <Field label="Empresa (opcional)">
              <input className="input" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
            </Field>
            <Field label="Idioma">
              <select className="input" value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </Field>
          </Section>
        )}

        {active === 'routines' && (
          <Section title="Rotinas Automáticas">
            <Toggle checked={routines.morningEnabled} onChange={(v) => setRoutines({ ...routines, morningEnabled: v })}
              label="Rotina Matinal" description="Resumo diário, emails e agenda ao acordar" />
            {routines.morningEnabled && (
              <Field label="Horário">
                <input type="time" className="input w-32" value={routines.morningTime}
                  onChange={(e) => setRoutines({ ...routines, morningTime: e.target.value })} />
              </Field>
            )}
            <Toggle checked={routines.eveningEnabled} onChange={(v) => setRoutines({ ...routines, eveningEnabled: v })}
              label="Rotina de Encerramento" description="Backup e resumo do dia" />
            <Toggle checked={routines.weeklyEnabled}  onChange={(v) => setRoutines({ ...routines, weeklyEnabled:  v })}
              label="Relatório Semanal" />
            <Toggle checked={routines.monthlyEnabled} onChange={(v) => setRoutines({ ...routines, monthlyEnabled: v })}
              label="Relatório Mensal" />
          </Section>
        )}

        {active === 'security' && (
          <Section title="Segurança e Permissões">
            <Field label="Nível de autonomia">
              <select className="input">
                <option value="conservative">Conservador — confirma quase tudo</option>
                <option value="moderate">Moderado — confirma ações sensíveis</option>
                <option value="advanced">Avançado — autonomia máxima</option>
              </select>
            </Field>
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300">
              <p className="font-medium mb-2">Regras imutáveis:</p>
              <ul className="space-y-1 text-red-400/80 list-disc list-inside">
                <li>Pagamentos sempre exigem confirmação + PIN</li>
                <li>Credenciais sempre criptografadas (AES-256)</li>
                <li>Câmera/microfone nunca ativados automaticamente</li>
              </ul>
            </div>
          </Section>
        )}

        {active === 'financial' && (
          <Section title="Configurações Financeiras">
            <Field label="Alerta de saldo mínimo (R$)">
              <input type="number" className="input w-48" defaultValue={500} min={0} />
            </Field>
            <Field label="Limite de pagamento autônomo (R$)" help="0 = sempre confirmar">
              <input type="number" className="input w-48" defaultValue={0} min={0} />
            </Field>
            <Field label="Alertar vencimentos com antecedência">
              <select className="input w-48">
                <option value="3">3 dias antes</option>
                <option value="5">5 dias antes</option>
                <option value="7">7 dias antes</option>
              </select>
            </Field>
          </Section>
        )}

        {active === 'integrations' && (
          <Section title="Integrações Externas">
            <p className="text-xs text-slate-500">
              Na versão desktop (Electron) você pode conectar Gmail, Outlook, Google Calendar e Open Finance.
              No APK Android, o chat com Gemini está sempre disponível.
            </p>
            {[
              { name: 'Gmail / Google Calendar', status: 'desktop-only' },
              { name: 'Microsoft Outlook',       status: 'desktop-only' },
              { name: 'WhatsApp Business',       status: 'desktop-only' },
              { name: 'Open Finance (BR)',        status: 'desktop-only' },
            ].map(({ name, status }) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-400 text-sm">{name}</span>
                <span className="badge-low text-xs">Apenas Desktop</span>
              </div>
            ))}
          </Section>
        )}

        {/* Save button */}
        <div className="flex justify-end pb-4">
          <button onClick={save} className={clsx('btn-primary', saved && 'bg-green-600 hover:bg-green-500')}>
            {saved ? <><CheckCircle size={14} /> Salvo!</> : <><Save size={14} /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  )
}
