import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Package, Box, Plus, TrendingUp } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { useVersionStore } from '@/store/useVersionStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useLaunchStore } from '@/store/useLaunchStore';
import { useToastStore } from '@/store/useToastStore';

function timeAgo(ts: number | undefined): string {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const account = useAccountStore((s) => s.active);
  const profiles = useProfileStore((s) => s.profiles);
  const manifest = useVersionStore((s) => s.manifest);
  const installed = useVersionStore((s) => s.installed);
  const startLaunch = useLaunchStore((s) => s.start);
  const toast = useToastStore((s) => s.push);

  const recent = useMemo(() => [...profiles].filter((p) => !p.archived).sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0)).slice(0, 3), [profiles]);
  const totalPlayTimeH = Math.round(profiles.reduce((s, p) => s + p.totalPlayTimeMs, 0) / 3_600_000);
  const totalLaunches = profiles.reduce((s, p) => s + p.launchCount, 0);

  const launch = async (id: string) => {
    try { await startLaunch(id); toast('Minecraft launching…', 'info'); navigate('/console'); }
    catch (e) { toast((e as Error).message, 'error'); }
  };

  return (
    <>
      <div className="page-header">
        <div><h1>Welcome back, {account?.username}</h1><p>Pick up where you left off, or start something new.</p></div>
        <button className="btn primary" onClick={() => navigate('/profiles')}><Plus size={16} /> New profile</button>
      </div>

      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <StatCard icon={<Box size={18} />} label="Installed versions" value={String(installed.length)} />
          <StatCard icon={<Package size={18} />} label="Profiles" value={String(profiles.length)} />
          <StatCard icon={<Clock size={18} />} label="Play time" value={`${totalPlayTimeH}h`} />
          <StatCard icon={<TrendingUp size={18} />} label="Launches" value={String(totalLaunches)} />
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recently played</h2>
        {recent.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ color: 'var(--text-2)', marginBottom: 12 }}>No profiles yet — create one to start playing.</div>
            <button className="btn primary" onClick={() => navigate('/profiles')}><Plus size={16} /> Create profile</button>
          </div>
        ) : (
          <div className="grid cols-3">
            {recent.map((p) => (
              <div key={p.id} className="card profile-card" onClick={() => launch(p.id)}>
                <div className="icon">🧱</div>
                <div>
                  <div className="name">{p.name}</div>
                  <div className="meta"><span className={`badge ${p.loader}`}>{p.loader}</span><span>{p.mcVersion}</span><span>· last played {timeAgo(p.lastPlayedAt)}</span></div>
                </div>
                <div className="actions"><button className="btn primary small" onClick={(e) => { e.stopPropagation(); launch(p.id); }}><Play size={14} /> Launch</button></div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Quick launch</h2>
        <div className="grid cols-2">
          {manifest && (
            <>
              <div className="card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>LATEST RELEASE</div><div style={{ fontSize: 20, fontWeight: 700 }}>{manifest.latest.release}</div></div><button className="btn ghost" onClick={() => navigate('/versions')}>Install</button></div></div>
              <div className="card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontSize: 11, color: 'var(--text-2)' }}>LATEST SNAPSHOT</div><div style={{ fontSize: 20, fontWeight: 700 }}>{manifest.latest.snapshot}</div></div><button className="btn ghost" onClick={() => navigate('/versions')}>Install</button></div></div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: JSX.Element; label: string; value: string }): JSX.Element {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)' }}>{icon}<span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span></div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
    </div>
  );
}
