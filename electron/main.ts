import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuthService } from './services/auth/AuthService';
import { VersionService } from './services/versions/VersionService';
import { ProfileService } from './services/profiles/ProfileService';
import { ModService } from './services/mods/ModService';
import { LaunchService } from './services/launch/LaunchService';
import { ConfigStore } from './services/store/ConfigStore';
import { DownloadManager } from './services/downloads/DownloadManager';
import { registerIpcHandlers } from './ipc/handlers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');

let mainWindow: BrowserWindow | null = null;

const configStore = new ConfigStore();
const authService = new AuthService(configStore);
const downloadManager = new DownloadManager();
const versionService = new VersionService(configStore, downloadManager);
const profileService = new ProfileService(configStore);
const modService = new ModService(configStore, downloadManager);
const launchService = new LaunchService(configStore, authService, versionService, profileService);

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: 'CubeLauncher',
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    icon: path.join(process.env.APP_ROOT!, 'build/icon.png'),
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerIpcHandlers(ipcMain, { authService, versionService, profileService, modService, launchService, configStore });

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:openExternal', (_e, url: string) => shell.openExternal(url));

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { launchService.shutdown(); });
process.on('uncaughtException', (err) => { console.error('[main] uncaughtException:', err); });
