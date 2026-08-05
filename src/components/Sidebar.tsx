import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Box, Boxes, Settings, Terminal, ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';

interface Props { collapsed: boolean; onToggle: () => void; }

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/profiles', label: 'Profiles', icon: Boxes },
  { to: '/versions', label: 'Versions', icon: Box },
  { to: '/mods', label: 'Mods', icon: Package },
  { to: '/console', label: 'Console', icon: Terminal },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar({ collapsed, onToggle }: Props): JSX.Element {
  const account = useAccountStore((s) => s.active);
  const logout = useAccountStore((s) => s.logout);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <span className="logo">C</span>
        {!collapsed && <span>CubeLauncher</span>}
      </div>
      <nav>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {!collapsed && <span className="label">{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="footer">
        <button className="btn ghost small" onClick={onToggle} style={{ justifyContent: 'center' }}>
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
        {account && (
          <div className="account" title={account.username}>
            <img src={account.avatarUrl ?? `https://crafatar.com/avatars/${account.uuid}?size=64&overlay`} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%231a1a2e"/><text x="32" y="40" font-family="sans-serif" font-size="24" fill="%23e94560" text-anchor="middle">?</text></svg>'; }} />
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="username" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.username}</div>
                <div className="status">
                  <span className={`status-dot ${account.type === 'microsoft' ? 'online' : 'offline'}`} />
                  {account.type === 'microsoft' ? 'Online' : 'Offline'}
                </div>
              </div>
            )}
            {!collapsed && (
              <button onClick={() => logout(account.id)} title="Sign out" style={{ color: 'var(--text-2)' }}><LogOut size={14} /></button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
