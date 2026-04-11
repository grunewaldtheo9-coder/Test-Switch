import React, { useState, useEffect, useCallback } from 'react'
import Sidebar       from './components/layout/Sidebar'
import MobileHeader  from './components/layout/MobileHeader'
import BottomNav     from './components/layout/BottomNav'
import Header        from './components/layout/Header'
import Dashboard     from './components/panels/Dashboard'
import ChatPanel     from './components/panels/ChatPanel'
import EmailPanel    from './components/panels/EmailPanel'
import CalendarPanel from './components/panels/CalendarPanel'
import FilesPanel    from './components/panels/FilesPanel'
import FinancialPanel from './components/panels/FinancialPanel'
import SystemPanel   from './components/panels/SystemPanel'
import LogPanel      from './components/panels/LogPanel'
import SettingsPanel from './components/panels/SettingsPanel'
import OnboardingModal    from './components/OnboardingModal'
import NotificationToast  from './components/NotificationToast'

// ── Settings bridge (works with Electron OR localStorage) ────────────────────

const storage = {
  get() {
    if (window.aria) return window.aria.getSettings()
    try { return Promise.resolve(JSON.parse(localStorage.getItem('aria_settings') ?? 'null')) }
    catch { return Promise.resolve(null) }
  },
  save(data) {
    if (window.aria) return window.aria.saveSettings(data)
    localStorage.setItem('aria_settings', JSON.stringify(data))
    return Promise.resolve(true)
  },
}

// ── Panel registry ────────────────────────────────────────────────────────────

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

// ── Detect if running as a mobile WebView (Capacitor / Android) ───────────────

function isMobile() {
  return (
    typeof window !== 'undefined' &&
    (window.Capacitor !== undefined ||
     /android|iphone|ipad|ipod/i.test(navigator.userAgent) ||
     window.innerWidth < 768)
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activePanel,    setActivePanel]    = useState('chat')   // Default to chat on mobile
  const [notifications,  setNotifications]  = useState([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [silentMode,     setSilentMode]     = useState(false)
  const [settings,       setSettings]       = useState(null)
  const [mobile,         setMobile]         = useState(isMobile())

  // Detect viewport size changes
  useEffect(() => {
    const handle = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  // Load settings on mount
  useEffect(() => {
    storage.get().then((s) => {
      if (!s) {
        setSettings({ onboardingDone: false, user: {} })
        setShowOnboarding(true)
      } else {
        setSettings(s)
        if (!s.onboardingDone) setShowOnboarding(true)
        // Default to dashboard once onboarded
        else if (!mobile) setActivePanel('dashboard')
      }
    })
  }, [])

  // Listen for tray commands (Electron only)
  useEffect(() => {
    if (!window.aria) return
    const u1 = window.aria.onCommand?.((cmd) => {
      if (cmd === 'resumo do dia') setActivePanel('dashboard')
      else if (cmd === 'verificar emails') setActivePanel('email')
      else setActivePanel('chat')
    })
    const u2 = window.aria.onSilentMode?.(setSilentMode)
    const u3 = window.aria.onNotification?.((n) => {
      if (!silentMode || n.type === 'critical') addNotification(n)
    })
    return () => { u1?.(); u2?.(); u3?.() }
  }, [silentMode])

  const addNotification = useCallback((n) => {
    const id = Date.now() + Math.random()
    setNotifications((prev) => [...prev.slice(-4), { ...n, id }])
    setTimeout(() => setNotifications((prev) => prev.filter((x) => x.id !== id)), 6000)
  }, [])

  async function handleOnboardingComplete(data) {
    const merged = { ...data, onboardingDone: true }
    await storage.save(merged)
    setSettings(merged)
    setShowOnboarding(false)
    setActivePanel(mobile ? 'chat' : 'dashboard')
  }

  const Panel = PANELS[activePanel] ?? ChatPanel

  // ── Render ──────────────────────────────────────────────────────────────────

  if (mobile) {
    // ── MOBILE LAYOUT (Android APK) ──────────────────────────────────────────
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-surface text-slate-200">
        {/* Mobile top header */}
        <MobileHeader
          panelName={activePanel}
          settings={settings}
          onOpenSettings={() => setActivePanel('settings')}
          silentMode={silentMode}
          onToggleSilent={() => setSilentMode((v) => !v)}
        />

        {/* Main content — above bottom nav */}
        <main className="flex-1 overflow-auto p-3 pb-2 animate-fade-in"
              style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
          <Panel
            settings={settings}
            addNotification={addNotification}
            onNavigate={setActivePanel}
          />
        </main>

        {/* Bottom navigation */}
        <BottomNav active={activePanel} onChange={setActivePanel} />

        {/* Notifications */}
        <div className="fixed bottom-20 right-3 flex flex-col gap-2 z-50 pointer-events-none max-w-[90vw]">
          {notifications.map((n) => (
            <NotificationToast
              key={n.id}
              notification={n}
              onClose={() => setNotifications((p) => p.filter((x) => x.id !== n.id))}
            />
          ))}
        </div>

        {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      </div>
    )
  }

  // ── DESKTOP LAYOUT (Electron) ────────────────────────────────────────────────
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

      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
        {notifications.map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={() => setNotifications((p) => p.filter((x) => x.id !== n.id))}
          />
        ))}
      </div>

      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
    </div>
  )
}
