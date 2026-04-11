import React, { useState } from 'react'
import {
  User, Mail, Calendar, TrendingUp, Shield, Bell,
  Link, Save, CheckCircle, Eye, EyeOff, Key,
} from 'lucide-react'
import clsx from 'clsx'

const SECTIONS = [
  { id: 'profile',      label: 'Perfil',          icon: User      },
  { id: 'integrations', label: 'Integrações',      icon: Link      },
  { id: 'routines',     label: 'Rotinas',          icon: Bell      },
  { id: 'security',     label: 'Segurança',        icon: Shield    },
  { id: 'financial',    label: 'Financeiro',       icon: TrendingUp},
]

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs text-slate-500 uppercase tracking-wider font-medium">{title}</h3>
      <div className="card p-5 space-y-4">{children}</div>
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

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-9 h-5 rounded-full transition-colors duration-200',
          checked ? 'bg-aria-600' : 'bg-surface-border',
        )}
      >
        <span className={clsx(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )} />
      </button>
      <span className="text-sm text-slate-300 group-hover:text-slate-200">{label}</span>
    </label>
  )
}

function ApiKeyField({ label, keyName, placeholder }) {
  const [show, setShow] = useState(false)
  const [val,  setVal]  = useState('')

  return (
    <Field label={label}>
      <div className="relative">
        <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type={show ? 'text' : 'password'}
          className="input pl-8 pr-10 font-mono text-xs"
          placeholder={placeholder}
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

export default function SettingsPanel({ settings, addNotification }) {
  const [active, setActive] = useState('profile')
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
    if (window.aria) await window.aria.saveSettings(data)
    setSaved(true)
    addNotification?.({ type: 'success', title: 'Configurações salvas!', body: 'Alterações aplicadas com sucesso.' })
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex gap-4 max-w-5xl mx-auto">
      {/* Section nav */}
      <div className="w-48 shrink-0 space-y-0.5">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={clsx(
              'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
              active === id
                ? 'bg-aria-600/20 text-aria-400 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-elevated',
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5">
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

        {active === 'integrations' && (
          <Section title="APIs e Integrações">
            <ApiKeyField label="Anthropic API Key" placeholder="sk-ant-..." />
            <ApiKeyField label="Google Client ID (OAuth)" placeholder="xxxxxxxx.apps.googleusercontent.com" />
            <ApiKeyField label="Microsoft Client ID (OAuth)" placeholder="xxxxxxxx-xxxx-xxxx-..." />

            <div className="pt-2 border-t border-surface-border space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Status das Integrações</p>
              {[
                { name: 'Gmail / Google Calendar', status: 'disconnected' },
                { name: 'Microsoft Outlook',       status: 'disconnected' },
                { name: 'WhatsApp Business',        status: 'disconnected' },
                { name: 'Open Finance',             status: 'disconnected' },
              ].map(({ name, status }) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{name}</span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full',
                    status === 'connected' ? 'badge-ok' : 'badge-low',
                  )}>
                    {status === 'connected' ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {active === 'routines' && (
          <Section title="Rotinas Automáticas">
            <Toggle checked={routines.morningEnabled} onChange={(v) => setRoutines({ ...routines, morningEnabled: v })} label="Rotina Matinal" />
            {routines.morningEnabled && (
              <Field label="Horário da rotina matinal">
                <input type="time" className="input w-32" value={routines.morningTime} onChange={(e) => setRoutines({ ...routines, morningTime: e.target.value })} />
              </Field>
            )}
            <Toggle checked={routines.eveningEnabled} onChange={(v) => setRoutines({ ...routines, eveningEnabled: v })} label="Rotina de Encerramento" />
            {routines.eveningEnabled && (
              <Field label="Horário do encerramento">
                <input type="time" className="input w-32" value={routines.eveningTime} onChange={(e) => setRoutines({ ...routines, eveningTime: e.target.value })} />
              </Field>
            )}
            <Toggle checked={routines.weeklyEnabled}  onChange={(v) => setRoutines({ ...routines, weeklyEnabled:  v })} label="Relatório Semanal (segunda, 09h)" />
            <Toggle checked={routines.monthlyEnabled} onChange={(v) => setRoutines({ ...routines, monthlyEnabled: v })} label="Relatório Mensal (dia 1, 08h)" />
          </Section>
        )}

        {active === 'security' && (
          <Section title="Segurança e Permissões">
            <Field label="Nível de autonomia" help="Define quanta autonomia a ARIA tem para agir sem confirmação.">
              <select className="input">
                <option value="conservative">Conservador — confirma quase tudo</option>
                <option value="moderate" selected>Moderado — confirma ações sensíveis</option>
                <option value="advanced">Avançado — autonomia máxima</option>
              </select>
            </Field>
            <Field label="Timeout de sessão" help="Minutos de inatividade antes de solicitar PIN novamente.">
              <input type="number" className="input w-32" defaultValue={480} min={10} max={1440} />
            </Field>
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-300">
              <p className="font-medium mb-1">Regras imutáveis de segurança:</p>
              <ul className="space-y-0.5 text-red-400/80 list-disc list-inside">
                <li>Pagamentos sempre exigem confirmação + PIN</li>
                <li>Credenciais são sempre criptografadas (AES-256)</li>
                <li>Câmera/microfone nunca ativados em segundo plano</li>
                <li>Dados financeiros nunca saem do dispositivo sem criptografia</li>
              </ul>
            </div>
          </Section>
        )}

        {active === 'financial' && (
          <Section title="Configurações Financeiras">
            <Field label="Alerta de saldo mínimo (R$)" help="Receba um alerta quando o saldo cair abaixo deste valor.">
              <input type="number" className="input w-48" defaultValue={500} min={0} />
            </Field>
            <Field label="Limite máximo para pagamento autônomo (R$)" help="Pagamentos acima deste valor sempre requerem PIN. 0 = sempre confirmar.">
              <input type="number" className="input w-48" defaultValue={0} min={0} />
            </Field>
            <Field label="Alerta de vencimento de contas" help="Quantos dias antes do vencimento para alertar?">
              <select className="input w-48">
                <option value="3">3 dias antes</option>
                <option value="5">5 dias antes</option>
                <option value="7" selected>7 dias antes</option>
                <option value="14">14 dias antes</option>
              </select>
            </Field>
          </Section>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button onClick={save} className={clsx('btn-primary', saved && 'bg-green-600 hover:bg-green-500')}>
            {saved ? <><CheckCircle size={14} /> Salvo!</> : <><Save size={14} /> Salvar alterações</>}
          </button>
        </div>
      </div>
    </div>
  )
}
