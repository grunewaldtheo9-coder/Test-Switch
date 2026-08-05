import { useState } from 'react';
import { Box, UserCircle, Loader2 } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { useToastStore } from '@/store/useToastStore';

export function Login(): JSX.Element {
  const [mode, setMode] = useState<'choice' | 'offline' | 'microsoft'>('choice');
  const [username, setUsername] = useState('Player');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<{ userCode: string; verificationUri: string } | null>(null);
  const loginOffline = useAccountStore((s) => s.loginOffline);
  const beginMs = useAccountStore((s) => s.beginMicrosoftLogin);
  const refresh = useAccountStore((s) => s.refresh);
  const toast = useToastStore((s) => s.push);

  const submitOffline = async () => {
    setBusy(true);
    try { await loginOffline(username); toast('Signed in', 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); }
  };

  const submitMicrosoft = async () => {
    setBusy(true);
    try {
      const c = await beginMs();
      if (c) {
        setChallenge(c); setMode('microsoft');
        const interval = setInterval(async () => {
          await refresh();
          const active = useAccountStore.getState().active;
          if (active && active.type === 'microsoft') { clearInterval(interval); setChallenge(null); }
        }, 3000);
      }
    } catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Box size={28} color="white" />
        </div>
        <h1>CubeLauncher</h1>
        <div className="tagline">A modern, open Minecraft launcher.</div>

        {mode === 'choice' && (
          <>
            <button className="btn primary" onClick={submitMicrosoft} disabled={busy}>
              {busy ? <Loader2 size={16} className="spin" /> : <UserCircle size={16} />} Sign in with Microsoft
            </button>
            <button className="btn ghost" onClick={() => setMode('offline')} disabled={busy}>Play offline</button>
            <div className="divider">Free to use · Open source</div>
            <div style={{ color: 'var(--text-2)', fontSize: 11 }}>You need a valid Minecraft account to play online.</div>
          </>
        )}

        {mode === 'offline' && (
          <>
            <div className="field"><label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={16} placeholder="Your in-game name" onKeyDown={(e) => e.key === 'Enter' && submitOffline()} />
            </div>
            <button className="btn primary" onClick={submitOffline} disabled={busy}>{busy ? 'Signing in...' : 'Play offline'}</button>
            <button className="btn ghost" onClick={() => setMode('choice')} disabled={busy}>Back</button>
          </>
        )}

        {mode === 'microsoft' && challenge && (
          <>
            <div style={{ background: 'var(--bg-2)', padding: 16, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>Visit <span style={{ color: 'var(--accent)' }}>{challenge.verificationUri}</span></div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, letterSpacing: '0.08em' }}>{challenge.userCode}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16 }}>Waiting for you to authorize the device...</div>
            <button className="btn ghost" onClick={() => { setMode('choice'); setChallenge(null); }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
