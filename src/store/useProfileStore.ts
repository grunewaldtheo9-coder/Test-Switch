import { create } from 'zustand';
import type { Profile } from '@/types';

interface ProfileState {
  profiles: Profile[];
  loading: boolean;
  refresh: () => Promise<void>;
  create: (input: Partial<Profile> & { name: string; mcVersion: string }) => Promise<Profile | null>;
  update: (id: string, patch: Partial<Profile>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
  openFolder: (id: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  loading: false,
  refresh: async () => {
    set({ loading: true });
    const list = (await window.cube.profiles.list()) as Profile[];
    set({ profiles: list ?? [], loading: false });
  },
  create: async (input) => {
    const created = (await window.cube.profiles.create({ loader: 'vanilla', memoryMb: 4096, ...input })) as Profile | { error: string };
    if ('error' in (created as { error?: string })) throw new Error((created as { error: string }).error);
    await get().refresh();
    return created as Profile;
  },
  update: async (id, patch) => { await window.cube.profiles.update(id, patch); await get().refresh(); },
  remove: async (id) => { await window.cube.profiles.remove(id); await get().refresh(); },
  duplicate: async (id) => { await window.cube.profiles.duplicate(id); await get().refresh(); },
  openFolder: async (id) => { await window.cube.profiles.openFolder(id); },
}));
