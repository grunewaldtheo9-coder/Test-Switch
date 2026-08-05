import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { ConfigStore } from '../store/ConfigStore';
import type { AuthService } from '../auth/AuthService';
import type { VersionService } from '../versions/VersionService';
import type { ProfileService } from '../profiles/ProfileService';
import type { LaunchStatus } from '../../types';

export class LaunchService extends EventEmitter {
  private running = new Map<string, { child: ChildProcess; status: LaunchStatus }>();

  constructor(
    private readonly config: ConfigStore,
    private readonly auth: AuthService,
    private readonly versions: VersionService,
    private readonly profiles: ProfileService,
  ) { super(); }

  getRunning(): LaunchStatus[] { return Array.from(this.running.values()).map((r) => r.status); }

  async start(profileId: string): Promise<LaunchStatus> {
    const profile = this.profiles.list().find((p) => p.id === profileId);
    if (!profile) throw new Error(`Profile not found: ${profileId}`);
    const account = this.auth.getActiveAccount();
    if (!account) throw new Error('No active account. Please sign in first.');
    const accessToken = account.type === 'offline' ? '0' : await this.auth.getAccessToken(account.id);
    const detail = this.versions.loadInstalledVersionDetail(profile.mcVersion);
    if (!detail) throw new Error(`Minecraft ${profile.mcVersion} is not installed. Install it from the Versions tab first.`);

    const classpath = this.buildClasspath(detail);
    const gameDir = profile.gameDirectory;
    const assetsDir = path.join(this.config.getSettings().installationDirectory, 'assets');
    const nativesDir = path.join(detail.directory, 'natives');
    fs.mkdirSync(nativesDir, { recursive: true });

    const javaExe = this.resolveJavaExe(profile.javaPath, detail.javaVersion?.majorVersion ?? 8);
    const jvmArgs = [
      `-Xmx${profile.memoryMb}M`, `-Xms${Math.min(profile.memoryMb, 1024)}M`,
      `-Djava.library.path=${nativesDir}`, `-Dminecraft.launcher.brand=CubeLauncher`, `-Dminecraft.launcher.version=0.1.0`,
      ...profile.jvmArgs.split(/\s+/).filter(Boolean), '-cp', classpath, detail.mainClass,
    ];

    const tokens: Record<string, string> = {
      auth_player_name: account.username, auth_uuid: account.uuid.replace(/-/g, ''),
      auth_access_token: accessToken || '0', auth_session: accessToken || '0', auth_xuid: '0',
      clientid: 'cubelauncher', user_type: account.type === 'microsoft' ? 'msa' : 'legacy', user_properties: '{}',
      version_name: detail.id, version_type: detail.type, game_directory: gameDir,
      assets_root: assetsDir, assets_index_name: detail.assetIndex.id,
      resolution_width: String(profile.gameResolution?.width ?? 854),
      resolution_height: String(profile.gameResolution?.height ?? 480),
      natives_directory: nativesDir, launcher_name: 'CubeLauncher', launcher_version: '0.1.0', classpath,
    };

    const gameArgs = this.buildGameArgs(detail, tokens, profile.server);
    const args = [...jvmArgs, ...gameArgs];
    const processId = randomUUID();
    const child = spawn(javaExe, args, { cwd: gameDir, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });
    const status: LaunchStatus = { processId, profileId, status: 'starting', startedAt: Date.now() };
    this.running.set(processId, { child, status });

    const handleChunk = (buf: Buffer, level: string) => {
      for (const raw of buf.toString('utf-8').split('\n')) {
        const line = raw.trimEnd();
        if (!line) continue;
        const detectedLevel = /\bERROR\b/.test(line) ? 'error' : /\bWARN\b/.test(line) ? 'warn' : /\bDEBUG\b/.test(line) ? 'debug' : level;
        this.emit('log', { processId, line, level: detectedLevel });
      }
    };

    child.stdout?.on('data', (c: Buffer) => {
      if (status.status === 'starting') { status.status = 'running'; this.emit('status', { ...status }); }
      handleChunk(c, 'info');
    });
    child.stderr?.on('data', (c: Buffer) => handleChunk(c, 'error'));

    child.on('close', (code) => {
      const finalStatus = code === 0 ? 'closed' : 'crashed';
      status.status = finalStatus;
      status.exitCode = code ?? undefined;
      this.profiles.recordLaunch(profileId, Date.now() - status.startedAt, finalStatus === 'crashed');
      this.emit('status', { ...status });
      this.running.delete(processId);
    });

    child.on('error', (err) => {
      status.status = 'crashed';
      this.emit('log', { processId, line: `[launcher] failed to spawn java: ${err.message}`, level: 'error' });
      this.emit('status', { ...status });
      this.running.delete(processId);
    });

    return status;
  }

  stop(processId: string): void {
    const entry = this.running.get(processId);
    if (!entry) return;
    entry.status.status = 'killed';
    entry.child.kill();
    this.emit('status', { ...entry.status });
  }

  shutdown(): void { for (const entry of this.running.values()) { try { entry.child.kill(); } catch {} } this.running.clear(); }

  private buildClasspath(detail: ReturnType<VersionService['loadInstalledVersionDetail']>): string {
    if (!detail) return '';
    const sep = process.platform === 'win32' ? ';' : ':';
    const root = this.config.getSettings().installationDirectory;
    const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    const parts: string[] = [];
    for (const lib of detail.libraries) {
      if (lib.rules) { let allowed = false; for (const rule of lib.rules) { const applies = !rule.os?.name || rule.os.name === os; if (applies) allowed = rule.action === 'allow'; } if (!allowed) continue; }
      const artifact = lib.downloads?.artifact;
      if (artifact) parts.push(path.join(root, 'libraries', artifact.path));
    }
    parts.push(path.join(detail.directory, `${detail.mcVersion}.jar`));
    return parts.join(sep);
  }

  private buildGameArgs(detail: NonNullable<ReturnType<VersionService['loadInstalledVersionDetail']>>, tokens: Record<string, string>, server?: { host: string; port: number }): string[] {
    const expand = (s: string): string => s.replace(/\$\{(\w+)\}/g, (_, k) => tokens[k] ?? '');
    const args: string[] = [];
    if (detail.minecraftArguments) args.push(...detail.minecraftArguments.split(/\s+/).map(expand));
    else if (detail.arguments?.game) { for (const a of detail.arguments.game) { if (typeof a === 'string') args.push(expand(a)); } }
    if (server) { args.push('--server', server.host, '--port', String(server.port)); }
    return args;
  }

  private resolveJavaExe(explicit: string | undefined, _requiredMajor: number): string {
    if (explicit && fs.existsSync(explicit)) return explicit;
    const configured = this.config.getSettings().javaInstallations;
    if (configured.length) return configured[0].path;
    return process.platform === 'win32' ? 'javaw.exe' : 'java';
  }
}
