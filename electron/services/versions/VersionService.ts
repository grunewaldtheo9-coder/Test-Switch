import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import type { ConfigStore } from '../store/ConfigStore';
import type { DownloadManager } from '../downloads/DownloadManager';
import type { InstalledVersion, LoaderType, MinecraftVersionManifest, MinecraftVersionManifestEntry } from '../../types';

const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
const FABRIC_META = 'https://meta.fabricmc.net/v2';
const QUILT_META = 'https://meta.quiltmc.org/v3';
const FORGE_PROMO = 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json';

interface MojangVersionDetail {
  id: string;
  type: string;
  mainClass: string;
  minecraftArguments?: string;
  arguments?: { game: unknown[]; jvm: unknown[] };
  assetIndex: { id: string; sha1: string; size: number; totalSize: number; url: string };
  assets: string;
  downloads: { client: { sha1: string; size: number; url: string }; server?: { sha1: string; size: number; url: string } };
  libraries: Array<{
    name: string;
    downloads?: { artifact?: { path: string; sha1: string; size: number; url: string }; classifiers?: Record<string, { path: string; sha1: string; size: number; url: string }> };
    rules?: Array<{ action: 'allow' | 'disallow'; os?: { name?: string } }>;
    natives?: Record<string, string>;
  }>;
  javaVersion?: { component: string; majorVersion: number };
  logging?: unknown;
}

export class VersionService {
  private manifestCache: MinecraftVersionManifest | null = null;
  private manifestCachedAt = 0;

  constructor(private readonly config: ConfigStore, private readonly downloads: DownloadManager) {}

  private gameRoot(): string { return this.config.getSettings().installationDirectory; }

  async listRemote(): Promise<MinecraftVersionManifest> {
    if (this.manifestCache && Date.now() - this.manifestCachedAt < 5 * 60 * 1000) return this.manifestCache;
    const manifest = await this.getJson<MinecraftVersionManifest>(VERSION_MANIFEST_URL);
    this.manifestCache = manifest;
    this.manifestCachedAt = Date.now();
    return manifest;
  }

  listInstalled(): InstalledVersion[] { return this.config.get('installedVersions'); }

  async install(versionId: string, loader: LoaderType = 'vanilla', loaderVersion?: string): Promise<InstalledVersion> {
    const manifest = await this.listRemote();
    const entry = manifest.versions.find((v) => v.id === versionId);
    if (!entry) throw new Error(`Unknown Minecraft version: ${versionId}`);
    const root = this.gameRoot();
    const versionDir = path.join(root, 'versions', versionId);
    fs.mkdirSync(versionDir, { recursive: true });
    const versionJsonPath = path.join(versionDir, `${versionId}.json`);
    if (!fs.existsSync(versionJsonPath)) {
      await this.downloads.download({ id: `${versionId}:json`, url: entry.url, dest: versionJsonPath, sha1: entry.sha1, label: `${versionId}.json` });
    }
    const detail = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8')) as MojangVersionDetail;
    await this.downloads.download({ id: `${versionId}:client`, url: detail.downloads.client.url, dest: path.join(versionDir, `${versionId}.jar`), sha1: detail.downloads.client.sha1, sizeHint: detail.downloads.client.size, label: `${versionId}.jar` });
    await this.downloadLibraries(detail);
    await this.downloadAssets(detail);
    if (loader === 'fabric' && loaderVersion) await this.installFabric(versionId, loaderVersion);
    else if (loader === 'quilt' && loaderVersion) await this.installQuilt(versionId, loaderVersion);

    const sizeBytes = this.estimateDirSize(versionDir);
    const installed: InstalledVersion = {
      id: loader === 'vanilla' ? versionId : `${versionId}-${loader}-${loaderVersion}`,
      type: entry.type, loader, loaderVersion, mcVersion: versionId, directory: versionDir,
      sizeBytes, installedAt: Date.now(), javaVersion: detail.javaVersion?.majorVersion ?? 8,
    };
    const versions = this.config.get('installedVersions').filter((v) => v.id !== installed.id);
    versions.push(installed);
    this.config.set('installedVersions', versions);
    return installed;
  }

  private async downloadLibraries(detail: MojangVersionDetail): Promise<void> {
    const root = this.gameRoot();
    const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    const jobs = detail.libraries.filter((lib) => this.ruleAllows(lib.rules, os)).flatMap((lib) => {
      const out: Array<{ url: string; dest: string; sha1: string; size: number }> = [];
      if (lib.downloads?.artifact) { const a = lib.downloads.artifact; out.push({ url: a.url, dest: path.join(root, 'libraries', a.path), sha1: a.sha1, size: a.size }); }
      if (lib.natives && lib.downloads?.classifiers) {
        const nativeKey = lib.natives[os]?.replace('${arch}', process.arch === 'x64' ? '64' : '32');
        if (nativeKey) { const native = lib.downloads.classifiers[nativeKey]; if (native) out.push({ url: native.url, dest: path.join(root, 'libraries', native.path), sha1: native.sha1, size: native.size }); }
      }
      return out;
    });
    await this.downloads.downloadAll(jobs.map((j, i) => ({ id: `lib:${i}`, url: j.url, dest: j.dest, sha1: j.sha1, sizeHint: j.size, label: path.basename(j.dest) })));
  }

  private ruleAllows(rules: MojangVersionDetail['libraries'][number]['rules'], os: string): boolean {
    if (!rules || rules.length === 0) return true;
    let allowed = false;
    for (const rule of rules) { const applies = !rule.os?.name || rule.os.name === os; if (applies) allowed = rule.action === 'allow'; }
    return allowed;
  }

  private async downloadAssets(detail: MojangVersionDetail): Promise<void> {
    const root = this.gameRoot();
    const indexPath = path.join(root, 'assets', 'indexes', `${detail.assetIndex.id}.json`);
    await this.downloads.download({ id: `assets:index:${detail.assetIndex.id}`, url: detail.assetIndex.url, dest: indexPath, sha1: detail.assetIndex.sha1, label: `${detail.assetIndex.id}.json` });
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as { objects: Record<string, { hash: string; size: number }> };
    const jobs = Object.entries(index.objects).map(([_name, obj]) => {
      const prefix = obj.hash.slice(0, 2);
      return { id: `assets:${obj.hash}`, url: `https://resources.download.minecraft.net/${prefix}/${obj.hash}`, dest: path.join(root, 'assets', 'objects', prefix, obj.hash), sha1: obj.hash, sizeHint: obj.size, label: obj.hash.slice(0, 8) };
    });
    await this.downloads.downloadAll(jobs);
  }

  async remove(versionId: string): Promise<void> {
    const versions = this.config.get('installedVersions');
    const v = versions.find((x) => x.id === versionId);
    if (!v) return;
    fs.rmSync(v.directory, { recursive: true, force: true });
    this.config.set('installedVersions', versions.filter((x) => x.id !== versionId));
  }

  async repair(versionId: string): Promise<InstalledVersion> {
    const v = this.config.get('installedVersions').find((x) => x.id === versionId);
    if (!v) throw new Error(`Not installed: ${versionId}`);
    return this.install(v.mcVersion, v.loader, v.loaderVersion);
  }

  async listLoaderVersions(mcVersion: string, loader: LoaderType): Promise<string[]> {
    if (loader === 'fabric') { const data = await this.getJson<Array<{ loader: { version: string } }>>(`${FABRIC_META}/versions/loader/${encodeURIComponent(mcVersion)}`); return data.map((d) => d.loader.version); }
    if (loader === 'quilt') { const data = await this.getJson<Array<{ loader: { version: string } }>>(`${QUILT_META}/versions/loader/${encodeURIComponent(mcVersion)}`); return data.map((d) => d.loader.version); }
    if (loader === 'forge') { const data = await this.getJson<{ promos: Record<string, string> }>(FORGE_PROMO); const rec = data.promos[`${mcVersion}-recommended`]; const latest = data.promos[`${mcVersion}-latest`]; return [rec, latest].filter(Boolean) as string[]; }
    return [];
  }

  private async installFabric(mcVersion: string, loaderVersion: string): Promise<void> {
    const root = this.gameRoot();
    const profileJson = await this.getJson<unknown>(`${FABRIC_META}/versions/loader/${encodeURIComponent(mcVersion)}/${encodeURIComponent(loaderVersion)}/profile/json`);
    const dir = path.join(root, 'versions', `fabric-loader-${loaderVersion}-${mcVersion}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `fabric-loader-${loaderVersion}-${mcVersion}.json`), JSON.stringify(profileJson, null, 2));
  }

  private async installQuilt(mcVersion: string, loaderVersion: string): Promise<void> {
    const root = this.gameRoot();
    const profileJson = await this.getJson<unknown>(`${QUILT_META}/versions/loader/${encodeURIComponent(mcVersion)}/${encodeURIComponent(loaderVersion)}/profile/json`);
    const dir = path.join(root, 'versions', `quilt-loader-${loaderVersion}-${mcVersion}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `quilt-loader-${loaderVersion}-${mcVersion}.json`), JSON.stringify(profileJson, null, 2));
  }

  private estimateDirSize(dir: string): number {
    let total = 0;
    const stack = [dir];
    while (stack.length) { const current = stack.pop()!; if (!fs.existsSync(current)) continue; for (const entry of fs.readdirSync(current, { withFileTypes: true })) { const full = path.join(current, entry.name); if (entry.isDirectory()) stack.push(full); else { try { total += fs.statSync(full).size; } catch { /* ignore */ } } } }
    return total;
  }

  loadInstalledVersionDetail(versionId: string): (MojangVersionDetail & { directory: string; mcVersion: string }) | null {
    const installed = this.config.get('installedVersions').find((v) => v.id === versionId);
    if (!installed) return null;
    const jsonPath = path.join(installed.directory, `${installed.mcVersion}.json`);
    if (!fs.existsSync(jsonPath)) return null;
    const detail = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as MojangVersionDetail;
    return { ...detail, directory: installed.directory, mcVersion: installed.mcVersion };
  }

  filterVersions(manifest: MinecraftVersionManifest, types: Array<'release' | 'snapshot' | 'old_beta' | 'old_alpha'>, text?: string): MinecraftVersionManifestEntry[] {
    return manifest.versions.filter((v) => {
      if (!types.includes(v.type as 'release')) return false;
      if (text && !v.id.toLowerCase().includes(text.toLowerCase())) return false;
      return true;
    });
  }

  private getJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'CubeLauncher/0.1', Accept: 'application/json' } }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          if (!res.statusCode || res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return; }
          try { resolve(JSON.parse(raw) as T); } catch (e) { reject(e as Error); }
        });
      }).on('error', reject);
    });
  }
}
