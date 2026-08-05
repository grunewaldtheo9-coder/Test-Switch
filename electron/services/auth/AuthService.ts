import crypto from 'node:crypto';
import { safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { Account } from '../../types';
import type { ConfigStore } from '../store/ConfigStore';
import { MicrosoftAuth, type DeviceCodeChallenge } from './MicrosoftAuth';

export class AuthService {
  private readonly ms = new MicrosoftAuth();
  private readonly tokenFile: string;
  private tokenCache: Record<string, { accessToken: string; refreshToken: string }> = {};
  private pendingChallenge: { challenge: DeviceCodeChallenge; promise: Promise<Account> } | null = null;

  constructor(private readonly config: ConfigStore) {
    const userData = app.getPath ? app.getPath('userData') : process.cwd();
    this.tokenFile = path.join(userData, 'tokens.bin');
    this.loadTokens();
  }

  private loadTokens(): void {
    try {
      if (!fs.existsSync(this.tokenFile)) return;
      const buf = fs.readFileSync(this.tokenFile);
      const plain = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf-8');
      this.tokenCache = JSON.parse(plain);
    } catch { this.tokenCache = {}; }
  }

  private saveTokens(): void {
    const plain = JSON.stringify(this.tokenCache);
    const buf = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(plain) : Buffer.from(plain, 'utf-8');
    fs.writeFileSync(this.tokenFile, buf);
  }

  private computeOfflineUuid(username: string): string {
    const md5 = crypto.createHash('md5').update(`OfflinePlayer:${username}`).digest();
    md5[6] = (md5[6] & 0x0f) | 0x30;
    md5[8] = (md5[8] & 0x3f) | 0x80;
    const hex = md5.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  async beginMicrosoftLogin(): Promise<DeviceCodeChallenge> {
    if (this.pendingChallenge) return this.pendingChallenge.challenge;
    const challenge = await this.ms.requestDeviceCode();
    const promise = (async () => {
      try {
        const msToken = await this.ms.pollForToken(challenge.deviceCode, challenge.interval, challenge.expiresIn);
        const result = await this.ms.completeAuthentication(msToken);
        const account: Account = {
          id: result.mcUuid, type: 'microsoft', username: result.mcUsername, uuid: result.mcUuid,
          expiresAt: result.expiresAt, avatarUrl: `https://crafatar.com/avatars/${result.mcUuid}?size=64&overlay`, lastUsedAt: Date.now(),
        };
        const accounts = this.config.get('accounts').filter((a) => a.id !== account.id);
        accounts.push(account);
        this.config.set('accounts', accounts);
        this.config.set('activeAccountId', account.id);
        this.tokenCache[account.id] = { accessToken: result.accessToken, refreshToken: result.refreshToken };
        this.saveTokens();
        return account;
      } finally { this.pendingChallenge = null; }
    })();
    this.pendingChallenge = { challenge, promise };
    promise.catch(() => {});
    return challenge;
  }

  loginOffline(username: string): Account {
    const cleaned = username.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(cleaned)) throw new Error('Username must be 3-16 characters, letters/digits/underscore only.');
    const uuid = this.computeOfflineUuid(cleaned);
    const account: Account = { id: `offline:${uuid}`, type: 'offline', username: cleaned, uuid, lastUsedAt: Date.now() };
    const accounts = this.config.get('accounts').filter((a) => a.id !== account.id);
    accounts.push(account);
    this.config.set('accounts', accounts);
    this.config.set('activeAccountId', account.id);
    return account;
  }

  logout(accountId: string): void {
    const accounts = this.config.get('accounts').filter((a) => a.id !== accountId);
    this.config.set('accounts', accounts);
    if (this.config.get('activeAccountId') === accountId) this.config.set('activeAccountId', accounts[0]?.id);
    delete this.tokenCache[accountId];
    this.saveTokens();
  }

  listAccounts(): Account[] { return this.config.get('accounts'); }
  getActiveAccount(): Account | undefined {
    const id = this.config.get('activeAccountId');
    return id ? this.config.get('accounts').find((a) => a.id === id) : undefined;
  }

  setActiveAccount(accountId: string): void {
    this.config.set('activeAccountId', accountId);
    const accounts = this.config.get('accounts').map((a) => a.id === accountId ? { ...a, lastUsedAt: Date.now() } : a);
    this.config.set('accounts', accounts);
  }

  async getAccessToken(accountId: string): Promise<string> {
    const account = this.config.get('accounts').find((a) => a.id === accountId);
    if (!account) throw new Error(`Account not found: ${accountId}`);
    if (account.type === 'offline') return '';
    const token = this.tokenCache[accountId];
    if (!token) throw new Error(`No stored token for account ${accountId}. Re-login required.`);
    if (!account.expiresAt || account.expiresAt - Date.now() < 5 * 60 * 1000) {
      const refreshed = await this.ms.refreshFromRefreshToken(token.refreshToken);
      this.tokenCache[accountId] = { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken };
      this.saveTokens();
      const accounts = this.config.get('accounts').map((a) => a.id === accountId ? { ...a, expiresAt: refreshed.expiresAt, username: refreshed.mcUsername } : a);
      this.config.set('accounts', accounts);
      return refreshed.accessToken;
    }
    return token.accessToken;
  }
}
