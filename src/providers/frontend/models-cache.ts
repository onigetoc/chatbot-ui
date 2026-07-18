/**
 * Models.dev cache service.
 *
 * Fetches https://models.dev/api.json directly from the browser,
 * caches in localStorage with 24h TTL.
 * User selections (checked models) stored separately.
 */

const CACHE_KEY = 'providers_models_dev_cache';
const SELECTIONS_KEY = 'providers_models_selections';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MODELS_DEV_URL = 'https://models.dev/api.json';

/** Raw model from models.dev */
export interface ModelsDevModel {
  id: string;
  name: string;
  family?: string;
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  modalities?: { input?: string[]; output?: string[] };
  cost?: { input?: number; output?: number };
  limit?: { context?: number; output?: number };
  release_date?: string;
}

/** Raw provider from models.dev */
export interface ModelsDevProvider {
  id: string;
  name: string;
  env?: string[];
  npm?: string;
  api?: string;
  doc?: string;
  models: Record<string, ModelsDevModel>;
}

/** The full models.dev response: { providerId: ProviderData } */
export type ModelsDevData = Record<string, ModelsDevProvider>;

interface CacheEntry {
  timestamp: number;
  data: ModelsDevData;
}

export interface UserSelections {
  models: string[];
}

/**
 * Get models.dev data — from localStorage cache if fresh, otherwise fetch.
 */
export async function getModelsDevData(forceRefresh = false): Promise<ModelsDevData> {
  if (!forceRefresh) {
    const cached = loadFromCache();
    if (cached) return cached;
  }

  const response = await fetch(MODELS_DEV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch models.dev: ${response.status}`);
  }

  const data: ModelsDevData = await response.json();
  saveToCache(data);
  return data;
}

function loadFromCache(): ModelsDevData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;

    return entry.data;
  } catch {
    return null;
  }
}

function saveToCache(data: ModelsDevData): void {
  try {
    const entry: CacheEntry = { timestamp: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (err) {
    console.warn('Failed to cache models.dev data:', err);
  }
}

/** Clear the models.dev cache (force re-fetch next time) */
export function clearModelsCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/** Load user selections from localStorage */
export function loadSelections(): UserSelections {
  try {
    const raw = localStorage.getItem(SELECTIONS_KEY);
    if (!raw) return { models: [] };
    return JSON.parse(raw);
  } catch {
    return { models: [] };
  }
}

/** Save user selections to localStorage */
export function saveSelections(selections: UserSelections): void {
  localStorage.setItem(SELECTIONS_KEY, JSON.stringify(selections));
}

/** Get the API base URL for a provider from cached data */
export function getProviderBaseURL(providerId: string): string | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const entry: CacheEntry = JSON.parse(raw);
    const provider = entry.data[providerId];
    return provider?.api || undefined;
  } catch {
    return undefined;
  }
}
