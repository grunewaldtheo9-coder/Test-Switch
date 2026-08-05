import { Minus, Square, X, Box } from 'lucide-react';

export function TitleBar(): JSX.Element {
  return (
    <div className="titlebar">
      <div className="title">
        <Box size={16} style={{ color: 'var(--accent)' }} />
        CubeLauncher
      </div>
      <div className="controls">
        <button onClick={() => window.cube.window.minimize()} aria-label="Minimize"><Minus size={14} /></button>
        <button onClick={() => window.cube.window.maximize()} aria-label="Maximize"><Square size={12} /></button>
        <button className="close" onClick={() => window.cube.window.close()} aria-label="Close"><X size={14} /></button>
      </div>
    </div>
  );
}
