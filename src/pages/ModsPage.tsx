import { useEffect, useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { useToastStore } from '@/store/useToastStore';
import type { LoaderType, ModInfo, ModSearchQuery } from '@/types';

export function ModsPage(): JSX.Element {
  const profiles = useProfileStore((s) => s.profiles);
  const [activeProfileId, setActiveProfileId] = useState<string | undefined>(profiles[0]?.id);
  const [text, setText] = useState('');
  const [results, setResults] = useState<ModInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [installingIds, setInstallingIds] = useState<Set<string>>(new Set());
  const toast = useToastStore((s) => s.push);
  const activeProfile = useMemo(() => profiles.find((p) => p.id === activeProfileId) ?? profiles[0], [profiles, activeProfileId]);

  useEffect(() => {
    if (!activeProfile) return;
    const query: ModSearchQuery = { text, loader: activeProfile.loader, mcVersion: activeProfile.mcVersion, sort: 'popularity', pageSize: 24 };
    setLoading(true);
    const handle = setTimeout(async () => {
      try { const res = (await window.cube.mods.search(query)) as ModInfo[]; setResults(res ?? []); }
      catch (e) { toast((e as Error).message, 'error'); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(handle);
  }, [text, activeProfile, toast]);

  const installMod = async (mod: ModInfo) => {
    if (!activeProfile) return;
    setInstallingIds((s) => new Set(s).add(mod.id));
    try { await window.cube.mods.install(activeProfile.id, { source: mod.source, id: mod.id, mcVersion: activeProfile.mcVersion, loader: activeProfile.loader as LoaderType }); toast(`Installed ${mod.name}`, 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setInstallingIds((s) => { const next = new Set(s); next.delete(mod.id); return next; }); }
  };

  return (
    <>
      <div className="page-header"><div><h1>Mods</h1><p>Browse and install mods from Modrinth and CurseForge.</p></div></div>
      {profiles.length === 0 ? (<div className="empty-state card" style={{ background: 'transparent' }}><h3>No profiles yet</h3><div>Create a profile before installing mods.</div></div>) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <select className="search" value={activeProfileId ?? ''} onChange={(e) => setActiveProfileId(e.target.value)} style={{ maxWidth: 260 }}>
              {profiles.map((p) => (<option key={p.id} value={p.id}>{p.name} — {p.mcVersion} ({p.loader})</option>))}
            </select>
            <div className="search" style={{ flex: 1 }}><Search size={14} color="var(--text-2)" /><input placeholder="Search mods..." value={text} onChange={(e) => setText(e.target.value)} /></div>
          </div>
          {loading && results.length === 0 && (<div>{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="skeleton" style={{ height: 96, marginBottom: 8 }} />))}</div>)}
          {!loading && results.length === 0 && (<div className="empty-state"><h3>No results</h3><div>Try a different search term or profile.</div></div>)}
          <div>
            {results.map((mod) => (
              <div key={`${mod.source}:${mod.id}`} className="mod-row">
                <img className="mod-icon" src={mod.iconUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"/>'} alt="" />
                <div style={{ minWidth: 0 }}><h3 className="mod-name">{mod.name}</h3><p className="mod-summary">{mod.summary}</p><div className="mod-meta"><span>by {mod.author}</span><span>· {mod.downloads.toLocaleString()} downloads</span><span>· {mod.source}</span></div></div>
                <button className="btn primary small" disabled={installingIds.has(mod.id)} onClick={() => installMod(mod)}><Download size={12} />{installingIds.has(mod.id) ? 'Installing…' : 'Install'}</button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
