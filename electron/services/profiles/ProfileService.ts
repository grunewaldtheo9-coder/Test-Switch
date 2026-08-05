import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { shell } from 'electron';
import type { ConfigStore } from '../store/ConfigStore';
import type { LoaderType, Profile } from '../../types';

export interface ProfileInput {
  name: string;
  icon?: string;
  mcVersion: string;
  loader: LoaderType;
  loaderVersion?: string;
  memoryMb?: number;
  jvmArgs?: string;
  gameResolution?: { width: number; height: number };
  javaPath?: string;
  notes?: string;
  group?: string;
  server?: { host: string; port: number };
}

export class ProfileService {
  constructor(private readonly config: ConfigStore) {}

  private root(): string { return path.join(this.config.getSettings().installationDirectory, 'profiles'); }

  list(): Profile[] { return this.config.get('profiles'); }

  private ensureDirs(id: string): string {
    const dir = path.join(this.root(), id);
    for (const sub of ['', 'mods', 'config', 'saves', 'resourcepacks', 'shaderpacks', 'crash-reports', 'logs']) {
      fs.mkdirSync(path.join(dir, sub), { recursive: true });
    }
    return dir;
  }

  create(input: ProfileInput): Profile {
    const id = randomUUID();
    const settings = this.config.getSettings();
    const gameDirectory = this.ensureDirs(id);
    const profile: Profile = {
      id, name: input.name.trim() || 'New Profile', icon: input.icon ?? 'grass_block',
      mcVersion: input.mcVersion, loader: input.loader, loaderVersion: input.loaderVersion,
      gameDirectory, memoryMb: input.memoryMb ?? settings.defaultMemoryMb,
      jvmArgs: input.jvmArgs ?? settings.defaultJvmArgs,
      gameResolution: input.gameResolution, javaPath: input.javaPath,
      notes: input.notes, group: input.group, favorite: false, archived: false,
      totalPlayTimeMs: 0, launchCount: 0, createdAt: Date.now(), server: input.server,
    };
    this.config.set('profiles', [...this.config.get('profiles'), profile]);
    return profile;
  }

  update(id: string, patch: Partial<Profile>): Profile {
    const profiles = this.config.get('profiles');
    const index = profiles.findIndex((p) => p.id === id);
    if (index < 0) throw new Error(`Profile not found: ${id}`);
    const updated = { ...profiles[index], ...patch, id: profiles[index].id };
    profiles[index] = updated;
    this.config.set('profiles', profiles);
    return updated;
  }

  remove(id: string, deleteFiles = false): void {
    const profile = this.config.get('profiles').find((p) => p.id === id);
    if (!profile) return;
    if (deleteFiles && fs.existsSync(profile.gameDirectory)) fs.rmSync(profile.gameDirectory, { recursive: true, force: true });
    this.config.set('profiles', this.config.get('profiles').filter((p) => p.id !== id));
  }

  duplicate(id: string): Profile {
    const source = this.config.get('profiles').find((p) => p.id === id);
    if (!source) throw new Error(`Profile not found: ${id}`);
    const copy = this.create({ name: `${source.name} (Copy)`, icon: source.icon, mcVersion: source.mcVersion, loader: source.loader, loaderVersion: source.loaderVersion, memoryMb: source.memoryMb, jvmArgs: source.jvmArgs, gameResolution: source.gameResolution, javaPath: source.javaPath, notes: source.notes, group: source.group, server: source.server });
    const srcMods = path.join(source.gameDirectory, 'mods');
    const dstMods = path.join(copy.gameDirectory, 'mods');
    if (fs.existsSync(srcMods)) { for (const entry of fs.readdirSync(srcMods)) fs.copyFileSync(path.join(srcMods, entry), path.join(dstMods, entry)); }
    return copy;
  }

  recordLaunch(id: string, durationMs: number, crashed: boolean): void {
    const profile = this.config.get('profiles').find((p) => p.id === id);
    if (!profile) return;
    this.update(id, { lastPlayedAt: Date.now(), totalPlayTimeMs: profile.totalPlayTimeMs + durationMs, launchCount: profile.launchCount + 1 });
    const stats = this.config.get('launchStats');
    const s = stats[id] ?? { launches: 0, crashes: 0, totalMs: 0 };
    s.launches += 1; s.totalMs += durationMs; if (crashed) s.crashes += 1;
    stats[id] = s;
    this.config.set('launchStats', stats);
  }

  openFolder(id: string): void {
    const profile = this.config.get('profiles').find((p) => p.id === id);
    if (profile) shell.openPath(profile.gameDirectory);
  }
}
