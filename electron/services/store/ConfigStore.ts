import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { Account, InstalledVersion, Profile, LauncherSettings } from '../../types';

export interface ConfigShape {
  version: 1;
  settings: LauncherSettings;
  accounts: Account[];
  activeAccountId?: string;
  profiles: Profile[];
  installedVersions: InstalledVersion[];
  installedMods: Record<string, unknown[]>;
  favorites: string[];
  launchStats: Record<string, { launches: number; crashes: number; totalMs: number }>;
}

function defaultSettings(): LauncherSettings {
  return {
    language: 'en',
    theme: 'dark',
    accentColor: '#e94560',
    startMinimized: false,
    checkUpdatesOnLaunch: true,
    notificationsEnabled: true,
    defaultMemoryMb: 4096,
    defaultJvmArgs: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M',
    javaInstallations: [],
    maxParallelDownloads: 4,
    downloadSpeedLimitMbps: 0,
    installationDirectory: '',
    hardwareAcceleration: true,
    logLevel: 'info',
    discordRichPresence: true,
    telemetryOptIn: false,
    closeOnGameLaunch: false,
    minimizeToTray: true,
    compactMode: false,
  };
}

function defaultShape(): ConfigShape {
  return {
    version: 1,
    settings: defaultSettings(),
    accounts: [],
    profiles: [],
    installedVersions: [],
    installedMods: {},
    favorites: [],
    launchStats: {},
  };
}

export class ConfigStore {
  private readonly file: string;
  private data: ConfigShape;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(filePath?: string) {
    const base = filePath ? path.dirname(filePath) : app.getPath ? app.getPath('userData') : path.join(process.cwd(), '.cubelauncher');
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    this.file = filePath ?? path.join(base, 'cubelauncher.json');
    this.data = this.load();
    if (!this.data.settings.installationDirectory) {
      this.data.settings.installationDirectory = path.join(base, 'minecraft');
      this.scheduleSave();
    }
  }

  private load(): ConfigShape {
    try {
      if (!fs.existsSync(this.file)) return defaultShape();
      const raw = fs.readFileSync(this.file, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ConfigShape>;
      return { ...defaultShape(), ...parsed, settings: { ...defaultSettings(), ...parsed.settings } };
    } catch {
      return defaultShape();
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => { this.saveTimer = null; this.flush(); }, 50);
  }

  flush(): void {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmp, this.file);
  }

  get<K extends keyof ConfigShape>(key: K): ConfigShape[K] { return this.data[key]; }

  set<K extends keyof ConfigShape>(key: K, value: ConfigShape[K]): void {
    this.data[key] = value;
    this.scheduleSave();
  }

  getSettings(): LauncherSettings { return this.data.settings; }

  updateSettings(patch: Partial<LauncherSettings>): LauncherSettings {
    this.data.settings = { ...this.data.settings, ...patch };
    this.scheduleSave();
    return this.data.settings;
  }

  all(): ConfigShape { return this.data; }

  reset(): void {
    this.data = defaultShape();
    this.data.settings.installationDirectory = path.join(path.dirname(this.file), 'minecraft');
    this.flush();
  }
}
