import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { BrowserWindow, type IpcMain } from 'electron';
import type { AuthService } from '../services/auth/AuthService';
import type { VersionService } from '../services/versions/VersionService';
import type { ProfileService } from '../services/profiles/ProfileService';
import type { ModService } from '../services/mods/ModService';
import type { LaunchService } from '../services/launch/LaunchService';
import type { ConfigStore } from '../services/store/ConfigStore';
import type { ProfileInput } from '../services/profiles/ProfileService';

export interface ServiceBundle {
  authService: AuthService;
  versionService: VersionService;
  profileService: ProfileService;
  modService: ModService;
  launchService: LaunchService;
  configStore: ConfigStore;
}

export function registerIpcHandlers(ipc: IpcMain, svc: ServiceBundle): void {
  const wrap = <A extends unknown[], R>(fn: (...args: A) => Promise<R> | R) =>
    async (_evt: unknown, ...args: A): Promise<R | { error: string }> => {
      try { return await fn(...args); } catch (err) { console.error('[ipc]', (err as Error).message); return { error: (err as Error).message }; }
    };

  ipc.handle('auth:loginMicrosoft', wrap(async () => svc.authService.beginMicrosoftLogin()));
  ipc.handle('auth:loginOffline', wrap(async (username: string) => svc.authService.loginOffline(username)));
  ipc.handle('auth:logout', wrap(async (id: string) => svc.authService.logout(id)));
  ipc.handle('auth:listAccounts', wrap(async () => svc.authService.listAccounts()));
  ipc.handle('auth:getActiveAccount', wrap(async () => svc.authService.getActiveAccount()));
  ipc.handle('auth:setActiveAccount', wrap(async (id: string) => svc.authService.setActiveAccount(id)));
  ipc.handle('auth:refresh', wrap(async (id: string) => svc.authService.getAccessToken(id)));

  ipc.handle('versions:listRemote', wrap(async () => svc.versionService.listRemote()));
  ipc.handle('versions:listInstalled', wrap(async () => svc.versionService.listInstalled()));
  ipc.handle('versions:install', wrap(async (id: string, loader?: string, loaderVersion?: string) => svc.versionService.install(id, (loader as 'vanilla') ?? 'vanilla', loaderVersion)));
  ipc.handle('versions:remove', wrap(async (id: string) => svc.versionService.remove(id)));
  ipc.handle('versions:repair', wrap(async (id: string) => svc.versionService.repair(id)));
  ipc.handle('versions:listLoaders', wrap(async (mc: string, loader: string) => svc.versionService.listLoaderVersions(mc, loader as 'fabric')));

  ipc.handle('profiles:list', wrap(async () => svc.profileService.list()));
  ipc.handle('profiles:create', wrap(async (input: ProfileInput) => svc.profileService.create(input)));
  ipc.handle('profiles:update', wrap(async (id: string, patch: object) => svc.profileService.update(id, patch)));
  ipc.handle('profiles:remove', wrap(async (id: string) => svc.profileService.remove(id)));
  ipc.handle('profiles:duplicate', wrap(async (id: string) => svc.profileService.duplicate(id)));
  ipc.handle('profiles:openFolder', wrap(async (id: string) => svc.profileService.openFolder(id)));

  ipc.handle('mods:search', wrap(async (q: object) => svc.modService.search(q as Record<string, never>)));
  ipc.handle('mods:install', wrap(async (profileId: string, modRef: object) => svc.modService.install(profileId, modRef as Parameters<ModService['install']>[1])));
  ipc.handle('mods:uninstall', wrap(async (profileId: string, modId: string) => svc.modService.uninstall(profileId, modId)));
  ipc.handle('mods:listInstalled', wrap(async (profileId: string) => svc.modService.listInstalled(profileId)));
  ipc.handle('mods:toggle', wrap(async (profileId: string, modId: string, enabled: boolean) => svc.modService.toggle(profileId, modId, enabled)));
  ipc.handle('mods:checkUpdates', wrap(async (profileId: string) => svc.modService.checkUpdates(profileId)));

  ipc.handle('launch:start', wrap(async (profileId: string) => svc.launchService.start(profileId)));
  ipc.handle('launch:stop', wrap(async (processId: string) => svc.launchService.stop(processId)));
  ipc.handle('launch:getRunning', wrap(async () => svc.launchService.getRunning()));

  svc.launchService.on('log', (payload: unknown) => { for (const w of BrowserWindow.getAllWindows()) w.webContents.send('launch:log', payload); });
  svc.launchService.on('status', (payload: unknown) => { for (const w of BrowserWindow.getAllWindows()) w.webContents.send('launch:status', payload); });

  ipc.handle('config:all', wrap(async () => svc.configStore.all()));
  ipc.handle('config:get', wrap(async (key: string) => svc.configStore.get(key as 'settings')));
  ipc.handle('config:set', wrap(async (key: string, value: unknown) => {
    if (key === 'settings') return svc.configStore.updateSettings(value as Parameters<ConfigStore['updateSettings']>[0]);
    svc.configStore.set(key as 'settings', value as ReturnType<ConfigStore['getSettings']>);
    return true;
  }));
  ipc.handle('config:reset', wrap(async () => svc.configStore.reset()));

  ipc.handle('system:info', wrap(async () => ({
    platform: process.platform, arch: process.arch, totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
    cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model ?? 'Unknown', hostname: os.hostname(), homedir: os.homedir(),
  })));

  ipc.handle('system:detectJava', wrap(async () => detectJava()));
}

async function detectJava(): Promise<Array<{ path: string; version: number }>> {
  const results: Array<{ path: string; version: number }> = [];
  const candidates: string[] = [];
  if (process.platform === 'win32') {
    for (const r of ['C:\\Program Files\\Java', 'C:\\Program Files (x86)\\Java', 'C:\\Program Files\\Eclipse Adoptium']) {
      if (!fs.existsSync(r)) continue;
      for (const name of fs.readdirSync(r)) { const p = path.join(r, name, 'bin', 'javaw.exe'); if (fs.existsSync(p)) candidates.push(p); }
    }
  } else if (process.platform === 'darwin') {
    const vms = '/Library/Java/JavaVirtualMachines';
    if (fs.existsSync(vms)) { for (const name of fs.readdirSync(vms)) { const p = path.join(vms, name, 'Contents/Home/bin/java'); if (fs.existsSync(p)) candidates.push(p); } }
  } else {
    for (const p of ['/usr/lib/jvm', '/usr/java', '/opt/java']) {
      if (!fs.existsSync(p)) continue;
      for (const name of fs.readdirSync(p)) { const bin = path.join(p, name, 'bin/java'); if (fs.existsSync(bin)) candidates.push(bin); }
    }
  }
  for (const candidate of candidates) { const version = await probeJavaVersion(candidate); if (version) results.push({ path: candidate, version }); }
  return results;
}

function probeJavaVersion(bin: string): Promise<number | null> {
  return new Promise((resolve) => {
    execFile(bin, ['-version'], (err, _stdout, stderr) => {
      if (err) return resolve(null);
      const match = /version\s+"(\d+)(?:\.(\d+))?/.exec(stderr);
      if (!match) return resolve(null);
      const major = Number(match[1]);
      resolve(major === 1 ? Number(match[2] ?? 8) : major);
    });
  });
}
