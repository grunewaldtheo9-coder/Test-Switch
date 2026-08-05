import { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useToastStore } from '@/store/useToastStore';

type Tab = 'general' | 'java' | 'downloads' | 'appearance' | 'advanced';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'general', label: 'General' }, { id: 'java', label: 'Java' },
  { id: 'downloads', label: 'Downloads' }, { id: 'appearance', label: 'Appearance' },
  { id: 'advanced', label: 'Advanced' },
];

export function SettingsPage(): JSX.Element {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);
  const toast = useToastStore((s) => s.push);
  const [tab, setTab] = useState<Tab>('general');

  if (!settings) return <div className="skeleton" style={{ height: 300 }} />;

  const upd = async (patch: Parameters<typeof update>[0]) => {
    try { await update(patch); } catch (e) { toast((e as Error).message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><div><h1>Settings</h1><p>Customize how CubeLauncher behaves.</p></div></div>
      <div className="tabs">{TABS.map((t) => (
        <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
      ))}</div>

      {tab === 'general' && (
        <div className="card">
          <div className="field"><label>Language</label>
            <select value={settings.language} onChange={(e) => upd({ language: e.target.value })}>
              <option value="en">English</option><option value="pt">Português</option><option value="es">Español</option>
              <option value="fr">Français</option><option value="de">Deutsch</option><option value="ja">日本語</option><option value="zh">中文</option>
            </select>
          </div>
          <ToggleField label="Start minimized" checked={settings.startMinimized} onChange={(v) => upd({ startMinimized: v })} />
          <ToggleField label="Check for updates on launch" checked={settings.checkUpdatesOnLaunch} onChange={(v) => upd({ checkUpdatesOnLaunch: v })} />
          <ToggleField label="Show notifications" checked={settings.notificationsEnabled} onChange={(v) => upd({ notificationsEnabled: v })} />
          <ToggleField label="Close launcher when game starts" checked={settings.closeOnGameLaunch} onChange={(v) => upd({ closeOnGameLaunch: v })} />
          <ToggleField label="Minimize to system tray" checked={settings.minimizeToTray} onChange={(v) => upd({ minimizeToTray: v })} />
          <ToggleField label="Discord Rich Presence" checked={settings.discordRichPresence} onChange={(v) => upd({ discordRichPresence: v })} />
        </div>
      )}

      {tab === 'java' && (
        <div className="card">
          <div className="field"><label>Default memory allocation: {settings.defaultMemoryMb} MB</label>
            <input type="range" min={1024} max={16384} step={512} value={settings.defaultMemoryMb} onChange={(e) => upd({ defaultMemoryMb: Number(e.target.value) })} /></div>
          <div className="field"><label>Global JVM arguments</label>
            <textarea rows={4} value={settings.defaultJvmArgs} onChange={(e) => upd({ defaultJvmArgs: e.target.value })}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg-2)', color: 'var(--text-0)', border: '1px solid var(--border)', borderRadius: 6, padding: 10 }} /></div>
          <button className="btn ghost" onClick={async () => {
            const found = await window.cube.system.detectJava();
            if (Array.isArray(found) && found.length > 0) { upd({ javaInstallations: found as typeof settings.javaInstallations }); toast(`Found ${found.length} Java installations`, 'success'); }
            else { toast('No Java installations found', 'warn'); }
          }}>Scan for Java</button>
          {settings.javaInstallations.length > 0 && (
            <div style={{ marginTop: 12 }}>{settings.javaInstallations.map((j, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', padding: '4px 0' }}>Java {j.version} — {j.path}</div>
            ))}</div>
          )}
        </div>
      )}

      {tab === 'downloads' && (
        <div className="card">
          <div className="field"><label>Parallel downloads: {settings.maxParallelDownloads}</label>
            <input type="range" min={1} max={8} step={1} value={settings.maxParallelDownloads} onChange={(e) => upd({ maxParallelDownloads: Number(e.target.value) })} /></div>
          <div className="field"><label>Download speed limit (MB/s, 0 = unlimited)</label>
            <input type="number" min={0} value={settings.downloadSpeedLimitMbps} onChange={(e) => upd({ downloadSpeedLimitMbps: Number(e.target.value) })} /></div>
          <div className="field"><label>Installation directory</label>
            <input value={settings.installationDirectory} onChange={(e) => upd({ installationDirectory: e.target.value })} /></div>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="card">
          <div className="field"><label>Theme</label>
            <select value={settings.theme} onChange={(e) => upd({ theme: e.target.value as typeof settings.theme })}>
              <option value="dark">Dark</option><option value="light">Light</option><option value="oled">OLED Black</option><option value="custom">Custom</option>
            </select></div>
          <div className="field"><label>Accent color</label>
            <input type="color" value={settings.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} style={{ height: 40, width: 80, padding: 2 }} /></div>
          <ToggleField label="Compact mode" checked={settings.compactMode} onChange={(v) => upd({ compactMode: v })} />
        </div>
      )}

      {tab === 'advanced' && (
        <div className="card">
          <ToggleField label="Hardware acceleration" checked={settings.hardwareAcceleration} onChange={(v) => upd({ hardwareAcceleration: v })} />
          <div className="field"><label>Log level</label>
            <select value={settings.logLevel} onChange={(e) => upd({ logLevel: e.target.value as typeof settings.logLevel })}>
              <option value="error">Error</option><option value="warn">Warn</option><option value="info">Info</option><option value="debug">Debug</option><option value="trace">Trace</option>
            </select></div>
          <ToggleField label="Anonymous telemetry (opt-in)" checked={settings.telemetryOptIn} onChange={(v) => upd({ telemetryOptIn: v })} />
          <button className="btn danger" onClick={async () => { if (!confirm('Reset all settings?')) return; await reset(); toast('Settings reset', 'success'); }} style={{ marginTop: 16 }}>Reset to defaults</button>
        </div>
      )}
    </>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span>{label}</span>
      <label className="switch"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="slider" /></label>
    </div>
  );
}
