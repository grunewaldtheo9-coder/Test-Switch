import { create } from 'zustand';
import type { Account } from '@/types';

interface AccountState {
  accounts: Account[];
  active?: Account;
  loading: boolean;
  refresh: () => Promise<void>;
  loginOffline: (username: string) => Promise<void>;
  beginMicrosoftLogin: () => Promise<{ userCode: string; verificationUri: string } | null>;
  logout: (id: string) => Promise<void>;
  setActive: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  active: undefined,
  loading: false,
  refresh: async () => {
    set({ loading: true });
    const [accounts, active] = await Promise.all([
      window.cube.auth.listAccounts() as Promise<Account[]>,
      window.cube.auth.getActiveAccount() as Promise<Account | undefined>,
    ]);
    set({ accounts: accounts ?? [], active, loading: false });
  },
  loginOffline: async (username) => {
    const result = await window.cube.auth.loginOffline(username);
    if ((result as { error?: string })?.error) throw new Error((result as { error: string }).error);
    await get().refresh();
  },
  beginMicrosoftLogin: async () => {
    return (await window.cube.auth.loginMicrosoft()) as { userCode: string; verificationUri: string } | null;
  },
  logout: async (id) => { await window.cube.auth.logout(id); await get().refresh(); },
  setActive: async (id) => { await window.cube.auth.setActiveAccount(id); await get().refresh(); },
}));
