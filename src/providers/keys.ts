/**
 * API Key management — read/write provider credentials.
 * 
 * Storage: JSON file (default: ~/.local/share/opencode/auth.json)
 * Adapt AUTH_PATH if your project stores keys elsewhere.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

/** Default path where keys are stored */
const AUTH_PATH = path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json');

/** Ensure the auth directory exists */
function ensureAuthDir(): void {
  const dir = path.dirname(AUTH_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Read all stored credentials (provider → key) */
export function readAllKeys(): Record<string, string> {
  try {
    if (fs.existsSync(AUTH_PATH)) {
      return JSON.parse(fs.readFileSync(AUTH_PATH, 'utf-8'));
    }
  } catch { /* corrupt file, start fresh */ }
  return {};
}

/** Get a single provider's API key (or undefined) */
export function getKey(provider: string): string | undefined {
  const keys = readAllKeys();
  return keys[provider];
}

/** Save/update a provider's API key */
export function saveKey(provider: string, key: string): void {
  ensureAuthDir();
  const keys = readAllKeys();
  keys[provider] = key;
  fs.writeFileSync(AUTH_PATH, JSON.stringify(keys, null, 2), 'utf-8');
}

/** Remove a provider's API key */
export function removeKey(provider: string): void {
  const keys = readAllKeys();
  if (keys[provider]) {
    delete keys[provider];
    ensureAuthDir();
    fs.writeFileSync(AUTH_PATH, JSON.stringify(keys, null, 2), 'utf-8');
  }
}

/** Check if a provider has a configured key */
export function hasKey(provider: string): boolean {
  return !!getKey(provider);
}

/** Scan system environment variables for known API key patterns */
export function scanEnvKeys(envToProvider: Record<string, string>): Array<{
  envVar: string;
  provider: string;
  masked: string;
  alreadyConfigured: boolean;
}> {
  const stored = readAllKeys();
  const results: Array<{
    envVar: string;
    provider: string;
    masked: string;
    alreadyConfigured: boolean;
  }> = [];

  for (const [envVar, provider] of Object.entries(envToProvider)) {
    const value = process.env[envVar];
    if (value && value.trim()) {
      const masked = value.length <= 10
        ? '***'
        : `${value.substring(0, 6)}...${value.slice(-4)}`;
      results.push({
        envVar,
        provider,
        masked,
        alreadyConfigured: !!stored[provider],
      });
    }
  }

  return results;
}
