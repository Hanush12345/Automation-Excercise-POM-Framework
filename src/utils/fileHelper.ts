import * as fs from 'fs';
import * as path from 'path';
import { Download } from '@playwright/test';

export const DOWNLOAD_DIR = path.resolve(process.cwd(), 'downloads');

export function ensureDir(dir: string): string {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Saves a download and returns its absolute path. */
export async function saveDownload(download: Download, fileName?: string): Promise<string> {
  ensureDir(DOWNLOAD_DIR);
  const target = path.join(DOWNLOAD_DIR, fileName ?? download.suggestedFilename());
  await download.saveAs(target);
  return target;
}

/**
 * Saves an already-fetched response body and returns its absolute path.
 *
 * Counterpart to saveDownload for engines where the browser download event is
 * unavailable (WebKit on Linux never fires one), so the caller can verify the
 * same artifact without depending on the download machinery.
 */
export function saveBuffer(body: Buffer, fileName: string): string {
  ensureDir(DOWNLOAD_DIR);
  const target = path.join(DOWNLOAD_DIR, fileName);
  fs.writeFileSync(target, body);
  return target;
}

export function fileExistsAndNotEmpty(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

export function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function cleanDownloads(): void {
  if (fs.existsSync(DOWNLOAD_DIR)) fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
}
