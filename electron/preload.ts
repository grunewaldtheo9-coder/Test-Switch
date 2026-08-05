import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

type Listener<T> = (payload: T) => void;

const api = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    openExternal: (url: string) => ipcRenderer.invoke('window:openExternal', url),
  },
  auth: {
    loginMicrosoft: () => ipcRenderer.invoke('auth:loginMicrosoft'),
    loginOffline: (username: string) => ipcRenderer.invoke('auth:loginOffline', username),
    logout: (accountId: string) => ipcRenderer.invoke('auth:logout', accountId),
    listAccounts: () => ipcRenderer.invoke('auth:listAccounts'),
    getActiveAccount: () => ipcRenderer.invoke('auth:getActiveAccount'),
    setActiveAccount: (accountId: string) => ipcRenderer.invoke('auth:setActiveAccount', accountId),
    refresh: (accountId: string) => ipcRenderer.invoke('auth:refresh', accountId),
  },
  versions: {
    listRemote: () => ipcRenderer.invoke('versions:listRemote'),
    listInstalled: () => ipcRenderer.invoke('versions:listInstalled'),
    install: (versionId: string, loader?: string, loaderVersion?: string) => ipcRenderer.invoke('versions:install', versionId, loader, loaderVersion),
    remove: (versionId: string) => ipcRenderer.invoke('versions:remove', versionId),
    repair: (versionId: string) => ipcRenderer.invoke('versions:repair', versionId),
    listLoaders: (mcVersion: string, loader: string) => ipcRenderer.invoke('versions:listLoaders', mcVersion, loader),
  },
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    create: (input: unknown) => ipcRenderer.invoke('profiles:create', input),
    update: (id: string, patch: unknown) => ipcRenderer.invoke('profiles:update', id, patch),
    remove: (id: string) => ipcRenderer.invoke('profiles:remove', id),
    duplicate: (id: string) => ipcRenderer.invoke('profiles:duplicate', id),
    export: (id: string, dest: string) => ipcRenderer.invoke('profiles:export', id, dest),
    import: (filePath: string) => ipcRenderer.invoke('profiles:import', filePath),
    openFolder: (id: string) => ipcRenderer.invoke('profiles:openFolder', id),
  },
  mods: {
    search: (query: unknown) => ipcRenderer.invoke('mods:search', query),
    getDetails: (source: string, id: string) => ipcRenderer.invoke('mods:getDetails', source, id),
    install: (profileId: string, modRef: unknown) => ipcRenderer.invoke('mods:install', profileId, modRef),
    uninstall: (profileId: string, modId: string) => ipcRenderer.invoke('mods:uninstall', profileId, modId),
    listInstalled: (profileId: string) => ipcRenderer.invoke('mods:listInstalled', profileId),
    toggle: (profileId: string, modId: string, enabled: boolean) => ipcRenderer.invoke('mods:toggle', profileId, modId, enabled),
    checkUpdates: (profileId: string) => ipcRenderer.invoke('mods:checkUpdates', profileId),
  },
  launch: {
    start: (profileId: string) => ipcRenderer.invoke('launch:start', profileId),
    stop: (processId: string) => ipcRenderer.invoke('launch:stop', processId),
    getRunning: () => ipcRenderer.invoke('launch:getRunning'),
    onLog: (cb: Listener<{ processId: string; line: string; level: string }>) => {
      const h = (_e: IpcRendererEvent, p: { processId: string; line: string; level: string }) => cb(p);
      ipcRenderer.on('launch:log', h);
      return () => ipcRenderer.removeListener('launch:log', h);
    },
    onStatus: (cb: Listener<{ processId: string; status: string; exitCode?: number }>) => {
      const h = (_e: IpcRendererEvent, p: { processId: string; status: string; exitCode?: number }) => cb(p);
      ipcRenderer.on('launch:status', h);
      return () => ipcRenderer.removeListener('launch:status', h);
    },
  },
  downloads: {
    onProgress: (cb: Listener<{ id: string; label: string; downloaded: number; total: number; speed: number }>) => {
      const h = (_e: IpcRendererEvent, p: { id: string; label: string; downloaded: number; total: number; speed: number }) => cb(p);
      ipcRenderer.on('download:progress', h);
      return () => ipcRenderer.removeListener('download:progress', h);
    },
  },
  config: {
    get: <T = unknown>(key: string) => ipcRenderer.invoke('config:get', key) as Promise<T>,
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    all: () => ipcRenderer.invoke('config:all'),
    reset: () => ipcRenderer.invoke('config:reset'),
  },
  system: {
    info: () => ipcRenderer.invoke('system:info'),
    detectJava: () => ipcRenderer.invoke('system:detectJava'),
  },
};

contextBridge.exposeInMainWorld('cube', api);
export type CubeAPI = typeof api;
