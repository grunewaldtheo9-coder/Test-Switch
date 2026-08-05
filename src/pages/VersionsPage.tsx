import { useMemo, useState } from 'react';
import { Search, Download, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useVersionStore } from '@/store/useVersionStore';
import { useToastStore } from '@/store/useToastStore';
import type { VersionType } from '@/types';

const VERSION_TYPE_LABELS: Record<VersionType, string> = { release: 'Releases', snapshot: 'Snapshots', old_beta: 'Old Beta', old_alpha: 'Old Alpha' };

export function VersionsPage(): JSX.Element {
  const manifest = useVersionStore((s) => s.manifest);
  const installed = useVersionStore((s) => s.installed);
  const loading = useVersionStore((s) => s.loading);
  const filter = useVersionStore((s) => s.filter);
  const setFilter = useVersionStore((s) => s.setFilter);
  const install = useVersionStore((s) => s.install);
  const remove = useVersionStore((s) => s.remove);
  const refresh = useVersionStore((s) => s.refresh);
  const toast = useToastStore((s) => s.push);
  const [installing, setInstalling] = useState<string | null>(null);
  const installedMap = useMemo(() => new Set(installed.map((v) => v.mcVersion)), [installed]);

  const filtered = useMemo(() => {
    if (!manifest) return [];
    return manifest.versions.filter((v) => { if (!filter.types.includes(v.type as VersionType)) return false; if (filter.text && !v.id.toLowerCase().includes(filter.text.toLowerCase())) return false; return true; });
  }, [manifest, filter]);

  const toggleType = (type: VersionType) => { const types = filter.types.includes(type) ? filter.types.filter((t) => t !== type) : [...filter.types, type]; setFilter({ types }); };

  const handleInstall = async (id: string) => { setInstalling(id); try { await install(id); toast(`Installed Minecraft ${id}`, 'success'); } catch (e) { toast((e as Error).message, 'error'); } finally { setInstalling(null); } };
  const handleRemove = async (id: string) => { if (!confirm(`Remove Minecraft ${id}?`)) return; try { await remove(id); toast(`Removed ${id}`, 'success'); } catch (e) { toast((e as Error).message, 'error'); } };

  return (
    <>
      <div className="page-header"><div><h1>Versions</h1><p>Browse and install Minecraft versions from the official Mojang manifest.</p></div><button className="btn ghost" onClick={() => refresh()}><RefreshCw size={14} /> Refresh</button></div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search" style={{ flex: 1, minWidth: 260 }}><Search size={14} color="var(--text-2)" /><input placeholder="Search versions..." value={filter.text} onChange={(e) => setFilter({ text: e.target.value })} /></div>
        {(Object.keys(VERSION_TYPE_LABELS) as VersionType[]).map((type) => (<button key={type} className={`btn ${filter.types.includes(type) ? 'primary' : 'ghost'}`} onClick={() => toggleType(type)}>{VERSION_TYPE_LABELS[type]}</button>))}
      </div>
      {loading && !manifest && (<div>{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="skeleton" style={{ height: 56, marginBottom: 8 }} />))}</div>)}
      {manifest && (
        <div>
          {filtered.slice(0, 200).map((v) => {
            const isInstalled = installedMap.has(v.id);
            const isInstalling = installing === v.id;
            return (
              <div key={v.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{v.id}</span><span className={`badge ${v.type}`}>{v.type.replace('_', ' ')}</span>
                    {isInstalled && <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> Installed</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>Released {new Date(v.releaseTime).toLocaleDateString()}</div>
                </div>
                {isInstalled ? (<button className="btn danger small" onClick={() => handleRemove(v.id)}><Trash2 size={12} /> Remove</button>)
                  : (<button className="btn primary small" onClick={() => handleInstall(v.id)} disabled={isInstalling}><Download size={12} /> {isInstalling ? 'Installing…' : 'Install'}</button>)}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
