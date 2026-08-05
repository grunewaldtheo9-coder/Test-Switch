import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Trash2, Square } from 'lucide-react';
import { useLaunchStore } from '@/store/useLaunchStore';
import { useToastStore } from '@/store/useToastStore';

const LEVELS = ['info', 'warn', 'error', 'debug'] as const;
type Level = (typeof LEVELS)[number];

export function ConsolePage(): JSX.Element {
  const logs = useLaunchStore((s) => s.logs);
  const running = useLaunchStore((s) => s.running);
  const clearLogs = useLaunchStore((s) => s.clearLogs);
  const stop = useLaunchStore((s) => s.stop);
  const toast = useToastStore((s) => s.push);
  const ref = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');
  const [levels, setLevels] = useState<Record<Level, boolean>>({
    info: true, warn: true, error: true, debug: false,
  });
  const [autoScroll, setAutoScroll] = useState(true);

  const filtered = useMemo(
    () => logs.filter((l) => {
      if (!levels[l.level]) return false;
      if (filter && !l.line.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    }),
    [logs, filter, levels],
  );

  useEffect(() => {
    if (autoScroll && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [filtered, autoScroll]);

  const onScroll = () => {
    if (!ref.current) return;
    setAutoScroll(ref.current.scrollTop + ref.current.clientHeight >= ref.current.scrollHeight - 40);
  };

  const copy = () => {
    navigator.clipboard.writeText(filtered.map((l) => l.line).join('\n'))
      .then(() => toast('Console copied', 'success'))
      .catch(() => toast('Could not copy', 'error'));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Console</h1>
          <p>{running.length > 0 ? `${running.length} instance${running.length > 1 ? 's' : ''} running` : 'No game running'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {running.map((r) => (
            <button key={r.processId} className="btn danger" onClick={() => stop(r.processId)}>
              <Square size={12} /> Kill
            </button>
          ))}
          <button className="btn ghost" onClick={copy}><Download size={14} /> Copy</button>
          <button className="btn ghost" onClick={clearLogs}><Trash2 size={14} /> Clear</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="search" style={{ flex: 1, minWidth: 240 }}>
          <input placeholder="Filter lines..." value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        {LEVELS.map((lvl) => (
          <button key={lvl} className={`btn ${levels[lvl] ? 'primary' : 'ghost'} small`} onClick={() => setLevels((s) => ({ ...s, [lvl]: !s[lvl] }))}>
            {lvl.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="console" ref={ref} onScroll={onScroll}>
        {filtered.length === 0
          ? <div className="line debug">{logs.length === 0 ? '// waiting for game output...' : '// no lines match the current filter'}</div>
          : filtered.map((l, i) => <div key={i} className={`line ${l.level}`}>{l.line}</div>)}
      </div>
    </>
  );
}
