import https from 'node:https';
import { URLSearchParams } from 'node:url';

const CLIENT_ID = '00000000402b5328';
const MC_SCOPE = 'XboxLive.signin offline_access';

export interface DeviceCodeChallenge {
  userCode: string;
  deviceCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface MinecraftAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  mcUuid: string;
  mcUsername: string;
}

interface MsTokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

interface XboxTokenResponse {
  IssueInstant: string;
  NotAfter: string;
  Token: string;
  DisplayClaims: { xui: Array<{ uhs: string }> };
}

interface MinecraftTokenResponse {
  username: string;
  roles: unknown[];
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MinecraftProfileResponse {
  id: string;
  name: string;
  skins?: Array<{ id: string; state: string; url: string; variant: string }>;
}

function postJson<T>(url: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      method: 'POST', hostname: u.hostname, path: u.pathname + u.search,
      headers: {
        'Content-Type': typeof body === 'string' ? 'application/x-www-form-urlencoded' : 'application/json',
        Accept: 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers,
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (!res.statusCode || res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 300)}`)); return; }
        try { resolve(JSON.parse(raw) as T); } catch (e) { reject(e as Error); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      method: 'GET', hostname: u.hostname, path: u.pathname + u.search,
      headers: { Accept: 'application/json', ...headers },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (!res.statusCode || res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 300)}`)); return; }
        try { resolve(JSON.parse(raw) as T); } catch (e) { reject(e as Error); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

export class MicrosoftAuth {
  async requestDeviceCode(): Promise<DeviceCodeChallenge> {
    const body = new URLSearchParams({ client_id: CLIENT_ID, scope: MC_SCOPE }).toString();
    const res = await postJson<{ user_code: string; device_code: string; verification_uri: string; expires_in: number; interval: number }>(
      'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode', body,
    );
    return { userCode: res.user_code, deviceCode: res.device_code, verificationUri: res.verification_uri, expiresIn: res.expires_in, interval: res.interval };
  }

  async pollForToken(deviceCode: string, interval: number, expiresIn: number): Promise<MsTokenResponse> {
    const deadline = Date.now() + expiresIn * 1000;
    let delay = Math.max(1, interval) * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, delay));
      try {
        const body = new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'urn:ietf:params:oauth:grant-type:device_code', device_code: deviceCode }).toString();
        return await postJson<MsTokenResponse>('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', body);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes('authorization_pending')) continue;
        if (msg.includes('slow_down')) { delay += 5000; continue; }
        if (msg.includes('expired_token') || msg.includes('authorization_declined')) throw e;
        continue;
      }
    }
    throw new Error('Device code flow expired');
  }

  async authenticateWithXboxLive(msAccessToken: string): Promise<XboxTokenResponse> {
    return postJson<XboxTokenResponse>('https://user.auth.xboxlive.com/user/authenticate', {
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${msAccessToken}` },
      RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT',
    });
  }

  async authenticateWithXSTS(xblToken: string): Promise<XboxTokenResponse> {
    try {
      return await postJson<XboxTokenResponse>('https://xsts.auth.xboxlive.com/xsts/authorize', {
        Properties: { SandboxId: 'RETAIL', UserTokens: [xblToken] },
        RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT',
      });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('2148916233')) throw new Error('This Microsoft account does not have an Xbox profile. Create one at xbox.com.');
      if (msg.includes('2148916238')) throw new Error('This account is a child account and must be added to a Microsoft Family.');
      throw e;
    }
  }

  async authenticateWithMinecraft(xstsToken: string, userHash: string): Promise<MinecraftTokenResponse> {
    return postJson<MinecraftTokenResponse>('https://api.minecraftservices.com/authentication/login_with_xbox', { identityToken: `XBL3.0 x=${userHash};${xstsToken}` });
  }

  async fetchProfile(minecraftAccessToken: string): Promise<MinecraftProfileResponse> {
    return getJson<MinecraftProfileResponse>('https://api.minecraftservices.com/minecraft/profile', { Authorization: `Bearer ${minecraftAccessToken}` });
  }

  async completeAuthentication(msToken: MsTokenResponse): Promise<MinecraftAuthResult> {
    const xbl = await this.authenticateWithXboxLive(msToken.access_token);
    const uhs = xbl.DisplayClaims.xui[0]?.uhs;
    if (!uhs) throw new Error('Xbox Live response missing user hash');
    const xsts = await this.authenticateWithXSTS(xbl.Token);
    const mc = await this.authenticateWithMinecraft(xsts.Token, uhs);
    const profile = await this.fetchProfile(mc.access_token);
    return { accessToken: mc.access_token, refreshToken: msToken.refresh_token, expiresAt: Date.now() + mc.expires_in * 1000, mcUuid: profile.id, mcUsername: profile.name };
  }

  async refreshFromRefreshToken(refreshToken: string): Promise<MinecraftAuthResult> {
    const body = new URLSearchParams({ client_id: CLIENT_ID, grant_type: 'refresh_token', refresh_token: refreshToken, scope: MC_SCOPE }).toString();
    const msToken = await postJson<MsTokenResponse>('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', body);
    return this.completeAuthentication(msToken);
  }
}
