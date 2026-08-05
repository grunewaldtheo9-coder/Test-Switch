import { create } from 'zustand';
import type { InstalledVersion, MinecraftVersionManifest, MinecraftVersionManifestEntry, VersionType } from '@/types';

interface VersionState {
  manifest: MinecraftVersionManifest | null;
  installed: InstalledVersion[];
  loading: boolean;
  filter: { types: VersionType[]; text: string };
  setFilter: (patch: Partial<VersionState['filter']>) => void;
  refresh: () => Promise<void>;
  install: (id: string, loader?: string, loaderVersion?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  filtered: () => MinecraftVersionManifestEntry[];
}

export const useVersionStore = create<VersionState>((set, get) => ({
  manifest: null,
  installed: [],
  loading: false,
  filter: { types: ['release'], text: '' },
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
  refresh: async () => {
    set({ loading: true });
    const [manifest, installed] = await Promise.all([
      window.cube.versions.listRemote() as Promise<MinecraftVersionManifest>,
      window.cube.versions.listInstalled() as Promise<InstalledVersion[]>,
    ]);
    set({ manifest, installed: installed ?? [], loading: false });
  },
  install: async (id, loader, loaderVersion) => { await window.cube.versions.install(id, loader, loaderVersion); await get().refresh(); },
  remove: async (id) => { await window.cube.versions.remove(id); await get().refresh(); },
  filtered: () => {
    const { manifest, filter } = get();
    if (!manifest) return [];
    return manifest.versions.filter((v) => {
      if (!filter.types.includes(v.type as VersionType)) return false;
      if (filter.text && !v.id.toLowerCase().includes(filter.text.toLowerCase())) return false;
      return true;
    });
  },
}));
