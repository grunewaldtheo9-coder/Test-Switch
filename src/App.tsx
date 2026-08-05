import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TitleBar } from '@/components/TitleBar';
import { Sidebar } from '@/components/Sidebar';
import { ToastHost } from '@/components/ToastHost';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { ProfilesPage } from '@/pages/ProfilesPage';
import { VersionsPage } from '@/pages/VersionsPage';
import { ModsPage } from '@/pages/ModsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ConsolePage } from '@/pages/ConsolePage';
import { useAccountStore } from '@/store/useAccountStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useVersionStore } from '@/store/useVersionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useLaunchStore } from '@/store/useLaunchStore';

export default function App(): JSX.Element {
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const account = useAccountStore((s) => s.active);
  const refreshAccounts = useAccountStore((s) => s.refresh);
  const refreshProfiles = useProfileStore((s) => s.refresh);
  const refreshVersions = useVersionStore((s) => s.refresh);
  const refreshSettings = useSettingsStore((s) => s.refresh);
  const hydrateLaunch = useLaunchStore((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      await Promise.allSettled([refreshAccounts(), refreshProfiles(), refreshSettings(), hydrateLaunch()]);
      refreshVersions().catch(() => undefined);
      setReady(true);
    })();
  }, [refreshAccounts, refreshProfiles, refreshVersions, refreshSettings, hydrateLaunch]);

  if (!ready) {
    return (
      <div className="app-shell">
        <TitleBar />
        <div className="page" style={{ padding: 40 }}>
          <div className="skeleton" style={{ height: 40, width: 240, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 120, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
      </div>
    );
  }

  if (!account) {
    return (<><TitleBar /><Login /><ToastHost /></>);
  }

  return (
    <div className="app-shell">
      <TitleBar />
      <div className={`app-body ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
        <main className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="/versions" element={<VersionsPage />} />
            <Route path="/mods" element={<ModsPage />} />
            <Route path="/console" element={<ConsolePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
