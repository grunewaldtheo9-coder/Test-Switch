import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { pipeline } from 'node:stream/promises';
import type { DownloadProgress } from '../../types';

export interface DownloadJob {
  id: string;
  url: string;
  dest: string;
  sha1?: string;
  label?: string;
  sizeHint?: number;
}

export class DownloadManager extends EventEmitter {
  private maxConcurrent: number;
  private active = 0;
  private queue: Array<{ job: DownloadJob; resolve: () => void; reject: (e: Error) => void }> = [];

  constructor(maxConcurrent = 4) { super(); this.maxConcurrent = maxConcurrent; }

  setConcurrency(n: number): void { this.maxConcurrent = Math.max(1, Math.min(8, n)); this.drain(); }

  download(job: DownloadJob): Promise<void> {
    return new Promise((resolve, reject) => { this.queue.push({ job, resolve, reject }); this.drain(); });
  }

  async downloadAll(jobs: DownloadJob[]): Promise<void> { await Promise.all(jobs.map((j) => this.download(j))); }

  private drain(): void {
    while (this.active < this.maxConcurrent && this.queue.length) {
      const next = this.queue.shift()!;
      this.active++;
      this.run(next.job).then(() => next.resolve()).catch((e) => next.reject(e)).finally(() => { this.active--; this.drain(); });
    }
  }

  private async run(job: DownloadJob): Promise<void> {
    const dir = path.dirname(job.dest);
    fs.mkdirSync(dir, { recursive: true });
    if (job.sha1 && fs.existsSync(job.dest)) {
      if (await this.verifyHash(job.dest, job.sha1)) return;
    }
    const partial = `${job.dest}.part`;
    let startAt = 0;
    if (fs.existsSync(partial)) startAt = fs.statSync(partial).size;
    await this.fetchStream(job, partial, startAt);
    fs.renameSync(partial, job.dest);
    if (job.sha1) {
      const ok = await this.verifyHash(job.dest, job.sha1);
      if (!ok) { fs.unlinkSync(job.dest); throw new Error(`SHA-1 mismatch for ${job.url}`); }
    }
  }

  private fetchStream(job: DownloadJob, partial: string, startAt: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const mod = job.url.startsWith('https:') ? https : http;
      const headers: Record<string, string> = { 'User-Agent': 'CubeLauncher/0.1' };
      if (startAt > 0) headers.Range = `bytes=${startAt}-`;
      const req = mod.get(job.url, { headers }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          this.fetchStream({ ...job, url: res.headers.location }, partial, startAt).then(resolve).catch(reject);
          return;
        }
        if (!res.statusCode || res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} for ${job.url}`)); return; }
        const contentLength = Number(res.headers['content-length'] || 0);
        const total = job.sizeHint ?? (contentLength ? contentLength + startAt : 0);
        const out = fs.createWriteStream(partial, { flags: startAt > 0 ? 'a' : 'w' });
        let downloaded = startAt;
        let lastEmit = Date.now();
        let lastDownloaded = downloaded;
        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          const now = Date.now();
          if (now - lastEmit > 200) {
            const elapsed = (now - lastEmit) / 1000;
            const speed = elapsed > 0 ? (downloaded - lastDownloaded) / elapsed : 0;
            const prog: DownloadProgress = { id: job.id, label: job.label ?? path.basename(job.dest), downloaded, total, speed };
            this.emit('progress', prog);
            lastEmit = now;
            lastDownloaded = downloaded;
          }
        });
        pipeline(res, out).then(() => {
          this.emit('progress', { id: job.id, label: job.label ?? path.basename(job.dest), downloaded, total: total || downloaded, speed: 0 } satisfies DownloadProgress);
          resolve();
        }).catch(reject);
      });
      req.on('error', reject);
    });
  }

  private verifyHash(file: string, expected: string): Promise<boolean> {
    return new Promise((resolve) => {
      const hash = crypto.createHash('sha1');
      const stream = fs.createReadStream(file);
      stream.on('data', (d) => hash.update(d));
      stream.on('end', () => resolve(hash.digest('hex') === expected));
      stream.on('error', () => resolve(false));
    });
  }
}
