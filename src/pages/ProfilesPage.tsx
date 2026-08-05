import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Folder, Copy, Trash2, X } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { useVersionStore } from '@/store/useVersionStore';
import { useLaunchStore } from '@/store/useLaunchStore';
import { useToastStore } from '@/store/useToastStore';
import type { LoaderType, Profile } from '@/types';

export function ProfilesPage(): JSX.Element {
  const navigate = useNavigate();
  const profiles = useProfileStore((s) => s.profiles);
  const remove = useProfileStore((s) => s.remove);
  const duplicate = useProfileStore((s) => s.duplicate);
  const openFolder = useProfileStore((s) => s.openFolder);
  const startLaunch = useLaunchStore((s) => s.start);
  const toast = useToastStore((s) => s.push);
  const [creating, setCreating] = useState(false);

  const launch = async (id: string) => {
    try { await startLaunch(id); toast('Minecraft launching…', 'info'); navigate('/console'); }
    catch (e) { toast((e as Error).message, 'error'); }
  };

  return (
    <>
      <div className="page-header"><div><h1>Profiles</h1><p>Isolated Minecraft instances — each with its own mods, saves, and settings.</p></div>
        <button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} /> New profile</button></div>

      {profiles.length === 0 ? (
        <div className="empty-state card" style={{ background: 'transparent' }}><h3>No profiles yet</h3><div>Create your first profile to get started.</div><button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} /> Create profile</button></div>
      ) : (
        <div className="grid cols-2">
          {profiles.map((p) => (
            <div key={p.id} className="card profile-card">
              <div className="icon">🧱</div>
              <div><div className="name">{p.name}</div><div className="meta"><span className={`badge ${p.loader}`}>{p.loader}</span><span>{p.mcVersion}</span>{p.loaderVersion && <span>· {p.loaderVersion}</span>}</div>
                <div className="meta" style={{ marginTop: 6 }}><span>{p.memoryMb} MB RAM</span><span>· {Math.round(p.totalPlayTimeMs / 3_600_000)}h played</span><span>· {p.launchCount} launches</span></div></div>
              <div className="actions">
                <button className="btn primary small" onClick={() => launch(p.id)}><Play size={14} /> Launch</button>
                <button className="btn ghost small" onClick={() => openFolder(p.id)} title="Open folder"><Folder size={14} /></button>
                <button className="btn ghost small" onClick={() => duplicate(p.id).then(() => toast('Profile duplicated', 'success'))} title="Duplicate"><Copy size={14} /></button>
                <button className="btn danger small" onClick={() => { if (confirm(`Delete profile "${p.name}"?`)) { remove(p.id); toast('Profile deleted', 'success'); } }} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <CreateProfileModal onClose={() => setCreating(false)} />}
    </>
  );
}

function CreateProfileModal({ onClose }: { onClose: () => void }): JSX.Element {
  const manifest = useVersionStore((s) => s.manifest);
  const create = useProfileStore((s) => s.create);
  const toast = useToastStore((s) => s.push);
  const [name, setName] = useState('');
  const [mcVersion, setMcVersion] = useState(manifest?.latest.release ?? '1.20.4');
  const [loader, setLoader] = useState<LoaderType>('vanilla');
  const [memoryMb, setMemoryMb] = useState(4096);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) { toast('Please enter a profile name.', 'warn'); return; }
    setBusy(true);
    try { await create({ name, mcVersion, loader, memoryMb }); toast('Profile created', 'success'); onClose(); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 100 }} onClick={onClose}>
      <div className="card" style={{ width: 480, padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 18 }}>New profile</h2><button onClick={onClose} style={{ color: 'var(--text-2)' }}><X size={16} /></button></div>
        <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Modded Survival" /></div>
        <div className="field"><label>Minecraft version</label>
          <select value={mcVersion} onChange={(e) => setMcVersion(e.target.value)}>
            {manifest?.versions.filter((v) => v.type === 'release').slice(0, 50).map((v) => (<option key={v.id} value={v.id}>{v.id}</option>))}
          </select></div>
        <div className="field"><label>Modloader</label>
          <select value={loader} onChange={(e) => setLoader(e.target.value as LoaderType)}>
            <option value="vanilla">Vanilla</option><option value="fabric">Fabric</option><option value="quilt">Quilt</option><option value="forge">Forge</option>
          </select></div>
        <div className="field"><label>Memory (MB): {memoryMb}</label><input type="range" min={1024} max={16384} step={512} value={memoryMb} onChange={(e) => setMemoryMb(Number(e.target.value))} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
