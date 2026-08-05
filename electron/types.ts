/**
 * Shared type definitions used across the Electron main process.
 * These types are mirrored in src/types for the renderer.
 */

export type AccountType = 'microsoft' | 'offline';
export type LoaderType = 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'optifine';
export type VersionType = 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
export type ModSource = 'curseforge' | 'modrinth' | 'local';

export interface Account {
  id: string;
  type: AccountType;
  username: string;
  uuid: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  avatarUrl?: string;
  lastUsedAt: number;
}

export interface MinecraftVersionManifestEntry {
  id: string;
  type: VersionType;
  url: string;
  time: string;
  releaseTime: string;
  sha1: string;
  complianceLevel: number;
}

export interface MinecraftVersionManifest {
  latest: { release: string; snapshot: string };
  versions: MinecraftVersionManifestEntry[];
}

export interface InstalledVersion {
  id: string;
  type: VersionType;
  loader: LoaderType;
  loaderVersion?: string;
  mcVersion: string;
  directory: string;
  sizeBytes: number;
  installedAt: number;
  javaVersion: number;
}

export interface Profile {
  id: string;
  name: string;
  icon: string;
  mcVersion: string;
  loader: LoaderType;
  loaderVersion?: string;
  gameDirectory: string;
  memoryMb: number;
  jvmArgs: string;
  gameResolution?: { width: number; height: number };
  javaPath?: string;
  notes?: string;
  group?: string;
  favorite: boolean;
  archived: boolean;
  lastPlayedAt?: number;
  totalPlayTimeMs: number;
  launchCount: number;
  createdAt: number;
  server?: { host: string; port: number };
}

export interface ModInfo {
  id: string;
  source: ModSource;
  slug: string;
  name: string;
  author: string;
  summary: string;
  description?: string;
  iconUrl?: string;
  downloads: number;
  updatedAt: string;
  categories: string[];
  loaders: LoaderType[];
  mcVersions: string[];
}

export interface InstalledMod {
  id: string;
  source: ModSource;
  name: string;
  version: string;
  fileName: string;
  sizeBytes: number;
  enabled: boolean;
  loader: LoaderType;
  mcVersion: string;
  installedAt: number;
  pinned: boolean;
}

export interface ModSearchQuery {
  text?: string;
  loader?: LoaderType;
  mcVersion?: string;
  category?: string;
  sort?: 'popularity' | 'updated' | 'name' | 'downloads' | 'trending';
  page?: number;
  pageSize?: number;
  source?: ModSource;
}

export interface LaunchStatus {
  processId: string;
  profileId: string;
  status: 'starting' | 'running' | 'closed' | 'crashed' | 'killed';
  startedAt: number;
  exitCode?: number;
}

export interface DownloadProgress {
  id: string;
  label: string;
  downloaded: number;
  total: number;
  speed: number;
}

export interface LauncherSettings {
  language: string;
  theme: 'dark' | 'light' | 'oled' | 'custom';
  accentColor: string;
  startMinimized: boolean;
  checkUpdatesOnLaunch: boolean;
  notificationsEnabled: boolean;
  defaultProfileId?: string;
  defaultMemoryMb: number;
  defaultJvmArgs: string;
  javaInstallations: Array<{ path: string; version: number }>;
  maxParallelDownloads: number;
  downloadSpeedLimitMbps: number;
  installationDirectory: string;
  hardwareAcceleration: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  discordRichPresence: boolean;
  telemetryOptIn: boolean;
  closeOnGameLaunch: boolean;
  minimizeToTray: boolean;
  compactMode: boolean;
}
