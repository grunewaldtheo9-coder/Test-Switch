import { create } from 'zustand';
import type { LauncherSettings } from '@/types';

interface SettingsState {
  settings: LauncherSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (patch: Partial<LauncherSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  refresh: async () => {
    set({ loading: true });
    const settings = (await window.cube.config.get('settings')) as LauncherSettings;
    set({ settings, loading: false });
    applyAccent(settings.accentColor);
  },
  update: async (patch) => {
    const current = get().settings;
    const next = { ...current, ...patch } as LauncherSettings;
    await window.cube.config.set('settings', next);
    set({ settings: next });
    applyAccent(next.accentColor);
  },
  reset: async () => { await window.cube.config.reset(); await get().refresh(); },
}));

function applyAccent(color: string): void {
  if (!color) return;
  document.documentElement.style.setProperty('--accent', color);
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.15)`);
  }
}
