import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import type { ConfigStore } from '../store/ConfigStore';
import type { DownloadManager } from '../downloads/DownloadManager';
import type { InstalledMod, LoaderType, ModInfo, ModSearchQuery, ModSource } from '../../types';

interface ModrinthSearchResponse {
  hits: Array<{
    project_id: string; slug: string; title: string; description: string; author: string;
    categories: string[]; downloads: number; follows: number; icon_url: string;
    date_modified: string; latest_version: string; versions: string[];
    client_side: string; server_side: string; project_type: string;
  }>;
  offset: number; limit: number; total_hits: number;
}

interface ModrinthVersion {
  id: string; project_id: string; name: string; version_number: string;
  game_versions: string[]; loaders: string[];
  files: Array<{ url: string; filename: string; hashes: { sha1: string }; size: number; primary: boolean }>;
  dependencies: Array<{ project_id: string; dependency_type: string }>;
}

const CACHE_MS = 60 * 1000;

export class ModService {
  private searchCache = new Map<string, { at: number; data: ModInfo[] }>();
  private curseforgeKey?: string;

  constructor(private readonly config: ConfigStore, private readonly downloads: DownloadManager) {
    this.curseforgeKey = process.env.CURSEFORGE_API_KEY;
  }

  async search(query: ModSearchQuery): Promise<ModInfo[]> {
    const key = JSON.stringify(query);
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
    const results: ModInfo[] = [];
    const source = query.source ?? 'modrinth';
    if (source === 'modrinth' || !this.curseforgeKey) results.push(...(await this.searchModrinth(query)));
    if (source === 'curseforge' && this.curseforgeKey) results.push(...(await this.searchCurseforge(query)));
    this.searchCache.set(key, { at: Date.now(), data: results });
    return results;
  }

  private async searchModrinth(query: ModSearchQuery): Promise<ModInfo[]> {
    const facets: string[][] = [['project_type:mod']];
    if (query.loader) facets.push([`categories:${query.loader}`]);
    if (query.mcVersion) facets.push([`versions:${query.mcVersion}`]);
    if (query.category) facets.push([`categories:${query.category}`]);
    const sortMap: Record<NonNullable<ModSearchQuery['sort']>, string> = { popularity: 'relevance', updated: 'updated', name: 'relevance', downloads: 'downloads', trending: 'follows' };
    const params = new URLSearchParams({
      query: query.text ?? '', limit: String(query.pageSize ?? 20),
      offset: String(((query.page ?? 1) - 1) * (query.pageSize ?? 20)),
      facets: JSON.stringify(facets), index: sortMap[query.sort ?? 'popularity'],
    });
    const data = await this.getJson<ModrinthSearchResponse>(`https://api.modrinth.com/v2/search?${params.toString()}`);
    return data.hits.map((h) => ({
      id: h.project_id, source: 'modrinth' as ModSource, slug: h.slug, name: h.title, author: h.author,
      summary: h.description, iconUrl: h.icon_url, downloads: h.downloads, updatedAt: h.date_modified,
      categories: h.categories,
      loaders: h.categories.filter((c): c is LoaderType => ['forge', 'fabric', 'quilt', 'optifine'].includes(c)),
      mcVersions: h.versions,
    }));
  }

  private async searchCurseforge(query: ModSearchQuery): Promise<ModInfo[]> {
    if (!this.curseforgeKey) return [];
    const params = new URLSearchParams({ gameId: '432', classId: '6', searchFilter: query.text ?? '', index: String(((query.page ?? 1) - 1) * (query.pageSize ?? 20)), pageSize: String(query.pageSize ?? 20) });
    if (query.mcVersion) params.set('gameVersion', query.mcVersion);
    const data = await this.getJsonWithHeaders<{ data: unknown[] }>(`https://api.curseforge.com/v1/mods/search?${params.toString()}`, { 'x-api-key': this.curseforgeKey });
    return (data.data as Array<Record<string, unknown>>).map((m) => ({
      id: String(m.id), source: 'curseforge' as ModSource, slug: String(m.slug), name: String(m.name),
      author: (m.authors as Array<{ name: string }> | undefined)?.[0]?.name ?? 'Unknown',
      summary: String(m.summary ?? ''), iconUrl: (m.logo as { thumbnailUrl?: string } | null | undefined)?.thumbnailUrl,
      downloads: Number(m.downloadCount ?? 0), updatedAt: String(m.dateModified ?? ''),
      categories: (m.categories as Array<{ name: string }> | undefined)?.map((c) => c.name) ?? [],
      loaders: [], mcVersions: [],
    }));
  }

  async install(profileId: string, modRef: { source: ModSource; id: string; mcVersion: string; loader: LoaderType }): Promise<InstalledMod> {
    const profile = this.config.get('profiles').find((p) => p.id === profileId);
    if (!profile) throw new Error(`Profile not found: ${profileId}`);
    if (modRef.source === 'modrinth') {
      const versions = await this.getJson<ModrinthVersion[]>(`https://api.modrinth.com/v2/project/${modRef.id}/version?loaders=["${modRef.loader}"]&game_versions=["${modRef.mcVersion}"]`);
      const best = versions[0];
      if (!best) throw new Error(`No compatible version for ${modRef.id}`);
      const file = best.files.find((f) => f.primary) ?? best.files[0];
      const dest = path.join(profile.gameDirectory, 'mods', file.filename);
      await this.downloads.download({ id: `mod:${modRef.id}:${best.id}`, url: file.url, dest, sha1: file.hashes.sha1, sizeHint: file.size, label: file.filename });
      const installed: InstalledMod = { id: `${modRef.source}:${modRef.id}`, source: modRef.source, name: best.name, version: best.version_number, fileName: file.filename, sizeBytes: file.size, enabled: true, loader: modRef.loader, mcVersion: modRef.mcVersion, installedAt: Date.now(), pinned: false };
      this.recordInstalled(profileId, installed);
      return installed;
    }
    throw new Error(`Unsupported mod source: ${modRef.source}`);
  }

  private recordInstalled(profileId: string, mod: InstalledMod): void {
    const all = this.config.get('installedMods');
    const list = (all[profileId] as InstalledMod[]) ?? [];
    all[profileId] = [...list.filter((m) => m.id !== mod.id), mod];
    this.config.set('installedMods', all);
  }

  listInstalled(profileId: string): InstalledMod[] { return (this.config.get('installedMods')[profileId] as InstalledMod[]) ?? []; }

  async uninstall(profileId: string, modId: string): Promise<void> {
    const profile = this.config.get('profiles').find((p) => p.id === profileId);
    if (!profile) return;
    const mods = this.listInstalled(profileId);
    const mod = mods.find((m) => m.id === modId);
    if (!mod) return;
    const file = path.join(profile.gameDirectory, 'mods', mod.fileName);
    const disabled = `${file}.disabled`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
    if (fs.existsSync(disabled)) fs.unlinkSync(disabled);
    const all = this.config.get('installedMods');
    all[profileId] = mods.filter((m) => m.id !== modId);
    this.config.set('installedMods', all);
  }

  toggle(profileId: string, modId: string, enabled: boolean): InstalledMod | null {
    const profile = this.config.get('profiles').find((p) => p.id === profileId);
    if (!profile) return null;
    const mods = this.listInstalled(profileId);
    const mod = mods.find((m) => m.id === modId);
    if (!mod) return null;
    const jarPath = path.join(profile.gameDirectory, 'mods', mod.fileName);
    const disabledPath = `${jarPath}.disabled`;
    try {
      if (enabled && fs.existsSync(disabledPath)) fs.renameSync(disabledPath, jarPath);
      else if (!enabled && fs.existsSync(jarPath)) fs.renameSync(jarPath, disabledPath);
    } catch { /* ignore */ }
    mod.enabled = enabled;
    const all = this.config.get('installedMods');
    all[profileId] = mods;
    this.config.set('installedMods', all);
    return mod;
  }

  async checkUpdates(profileId: string): Promise<Array<{ modId: string; latest: string }>> {
    return this.listInstalled(profileId).filter((m) => !m.pinned).map((m) => ({ modId: m.id, latest: m.version }));
  }

  private getJson<T>(url: string): Promise<T> { return this.getJsonWithHeaders<T>(url, {}); }

  private getJsonWithHeaders<T>(url: string, headers: Record<string, string>): Promise<T> {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'CubeLauncher/0.1', Accept: 'application/json', ...headers } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { this.getJsonWithHeaders<T>(res.headers.location, headers).then(resolve).catch(reject); res.resume(); return; }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          if (!res.statusCode || res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 200)}`)); return; }
          try { resolve(JSON.parse(raw) as T); } catch (e) { reject(e as Error); }
        });
      }).on('error', reject);
    });
  }
}
