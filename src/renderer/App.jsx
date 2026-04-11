import React, { useState, useEffect } from 'react'
import Sidebar    from './components/layout/Sidebar'
import Header     from './components/layout/Header'
import Dashboard  from './components/panels/Dashboard'
import ChatPanel  from './components/panels/ChatPanel'
import EmailPanel from './components/panels/EmailPanel'
import CalendarPanel from './components/panels/CalendarPanel'
import FilesPanel from './components/panels/FilesPanel'
import FinancialPanel from './components/panels/FinancialPanel'
import SystemPanel from './components/panels/SystemPanel'
import LogPanel    from './components/panels/LogPanel'
import SettingsPanel from './components/panels/SettingsPanel'
import OnboardingModal from './components/OnboardingModal'
import NotificationToast from './components/NotificationToast'

const PANELS = {
  dashboard:  Dashboard,
  chat:       ChatPanel,
  email:      EmailPanel,
  calendar:   CalendarPanel,
  files:      FilesPanel,
  financial:  FinancialPanel,
  system:     SystemPanel,
  logs:       LogPanel,
  settings:   SettingsPanel,
}

export default function App() {
  const [activePanel,    setActivePanel]    = useState('dashboard')
  const [notifications,  setNotifications]  = useState([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [silentMode,     setSilentMode]     = useState(false)
  const [settings,       setSettings]       = useState(null)

  // Load settings on mount
  useEffect(() => {
    async function init() {
      if (window.aria) {
        const s = await window.aria.getSettings()
        setSettings(s)
        if (!s.onboardingDone) setShowOnboarding(true)
      } else {
        // Browser dev mode fallback
        setSettings({ onboardingDone: true, user: { name: 'Usuário' } })
      }
    }
    init()
  }, [])

  // Listen for tray commands & notifications
  useEffect(() => {
    if (!window.aria) return

    const unsub1 = window.aria.onCommand((cmd) => {
      if (cmd === 'resumo do dia') setActivePanel('dashboard')
      else if (cmd === 'verificar emails') setActivePanel('email')
      else setActivePanel('chat')
    })

    const unsub2 = window.aria.onSilentMode(setSilentMode)

    const unsub3 = window.aria.onNotification((n) => {
      if (silentMode && n.type !== 'critical') return
      addNotification(n)
    })

    return () => { unsub1?.(); unsub2?.(); unsub3?.() }
  }, [silentMode])

  function addNotification(n) {
    const id = Date.now()
    setNotifications((prev) => [...prev, { ...n, id }])
    setTimeout(() => removeNotification(id), 6000)
  }

  function removeNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const Panel = PANELS[activePanel] ?? Dashboard

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-slate-200">
      <Sidebar
        active={activePanel}
        onChange={setActivePanel}
        silentMode={silentMode}
        onToggleSilent={() => setSilentMode((v) => !v)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          panelName={activePanel}
          settings={settings}
          onOpenSettings={() => setActivePanel('settings')}
        />

        <main className="flex-1 overflow-auto p-4 animate-fade-in">
          <Panel
            settings={settings}
            addNotification={addNotification}
            onNavigate={setActivePanel}
          />
        </main>
      </div>

      {/* Notification stack */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
        {notifications.map((n) => (
          <NotificationToast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
        ))}
      </div>

      {showOnboarding && (
        <OnboardingModal
          onComplete={async (data) => {
            if (window.aria) await window.aria.saveSettings({ ...data, onboardingDone: true })
            setSettings((s) => ({ ...s, ...data, onboardingDone: true }))
            setShowOnboarding(false)
          }}
        />
      )}
    </div>
  )
}
