import { create } from 'zustand';
import type { LaunchStatus } from '@/types';

export interface LogLine {
  processId: string;
  line: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  at: number;
}

interface LaunchState {
  running: LaunchStatus[];
  logs: LogLine[];
  maxLogs: number;
  addLog: (log: LogLine) => void;
  setStatus: (status: LaunchStatus) => void;
  clearLogs: () => void;
  start: (profileId: string) => Promise<LaunchStatus>;
  stop: (processId: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLaunchStore = create<LaunchState>((set, get) => ({
  running: [],
  logs: [],
  maxLogs: 2000,
  addLog: (log) => set((s) => {
    const logs = [...s.logs, log];
    if (logs.length > s.maxLogs) logs.splice(0, logs.length - s.maxLogs);
    return { logs };
  }),
  setStatus: (status) => set((s) => {
    const filtered = s.running.filter((r) => r.processId !== status.processId);
    if (status.status === 'running' || status.status === 'starting') return { running: [...filtered, status] };
    return { running: filtered };
  }),
  clearLogs: () => set({ logs: [] }),
  start: async (profileId) => {
    const result = (await window.cube.launch.start(profileId)) as LaunchStatus;
    if ((result as unknown as { error?: string })?.error) throw new Error((result as unknown as { error: string }).error);
    get().setStatus(result);
    return result;
  },
  stop: async (processId) => { await window.cube.launch.stop(processId); },
  hydrate: async () => {
    const running = (await window.cube.launch.getRunning()) as LaunchStatus[];
    set({ running: running ?? [] });
  },
}));

if (typeof window !== 'undefined' && window.cube) {
  window.cube.launch.onLog((payload) => {
    useLaunchStore.getState().addLog({ processId: payload.processId, line: payload.line, level: (payload.level as LogLine['level']) ?? 'info', at: Date.now() });
  });
  window.cube.launch.onStatus((payload) => {
    useLaunchStore.getState().setStatus({ processId: payload.processId, profileId: '', status: payload.status as LaunchStatus['status'], startedAt: 0, exitCode: payload.exitCode });
  });
}
