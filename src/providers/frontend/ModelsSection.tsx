/**
 * Models Selection UI Component.
 *
 * Dependencies: react, lucide-react, tailwindcss
 * Fetches model data from https://models.dev/api.json (browser-side).
 * Selections stored in localStorage.
 *
 * Optional: sync selections to your backend by replacing the
 * `onModelsChanged` callback.
 */
import { useState, useEffect } from 'react';
import { Check, RefreshCw, Info } from 'lucide-react';
import { getModelsDevData, clearModelsCache, loadSelections, saveSelections } from './models-cache';
import { MODELS_CHANGED_EVENT } from '../../hooks/useModels';
import { POPULAR_PROVIDERS } from './popular-providers';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length?: number;
  pricing?: { prompt?: number; completion?: number };
}

interface ProviderGroup {
  id: string;
  name: string;
  models: ModelInfo[];
}

interface ModelsSectionProps {
  isDark: boolean;
  /** Called whenever the user changes model selections. Use to sync to backend. */
  onModelsChanged?: (selectedModelIds: string[]) => void;
}

export default function ModelsSection({ isDark, onModelsChanged }: ModelsSectionProps) {
  const [providers, setProviders] = useState<ProviderGroup[]>([]);
  const popularProviders = POPULAR_PROVIDERS;
  const [selectedProviderId, setSelectedProviderId] = useState<string>('opencode');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => { loadProviders(); }, []);

  useEffect(() => {
    const saved = loadSelections();
    if (saved.models.length > 0) setSelectedModels(new Set(saved.models));
  }, []);

  useEffect(() => {
    if (selectedModels.size > 0) {
      const list = Array.from(selectedModels);
      saveSelections({ models: list });
      onModelsChanged?.(list);
      // Notify useModels hook in the same tab
      window.dispatchEvent(new CustomEvent(MODELS_CHANGED_EVENT));
    }
  }, [selectedModels]);

  const loadProviders = async () => {
    try {
      setLoading(true); setError(null);
      const modelsDevData = await getModelsDevData();
      const arr: ProviderGroup[] = [];

      for (const [providerId, providerData] of Object.entries(modelsDevData)) {
        const models: ModelInfo[] = Object.values(providerData.models).map((m) => ({
          id: m.id.includes('/') ? m.id : `${providerId}/${m.id}`,
          name: m.name,
          provider: providerId,
          context_length: m.limit?.context,
          pricing: m.cost ? { prompt: m.cost.input, completion: m.cost.output } : undefined,
        }));
        arr.push({ id: providerId, name: providerData.name, models });
      }

      // Sort: popular first, then alphabetical
      arr.sort((a, b) => {
        const aPopular = popularProviders.includes(a.id) ? 0 : 1;
        const bPopular = popularProviders.includes(b.id) ? 0 : 1;
        if (aPopular !== bPopular) return aPopular - bPopular;
        return a.name.localeCompare(b.name);
      });

      setProviders(arr);

      // Load saved selections
      const saved = loadSelections();
      if (saved.models.length > 0) {
        setSelectedModels(new Set(saved.models));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    clearModelsCache();
    await loadProviders();
    setRefreshing(false);
  };

  const toggleModel = (id: string) => {
    const next = new Set(selectedModels);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedModels(next);
  };

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  const filteredModels = selectedProvider?.models.filter(m =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  ) ?? [];

  const toggleAllVisible = () => {
    const next = new Set(selectedModels);
    const allSelected = filteredModels.every(m => next.has(m.id));
    for (const m of filteredModels) { allSelected ? next.delete(m.id) : next.add(m.id); }
    setSelectedModels(next);
  };

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(providerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Providers & Models</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Choose AI models for your chat interface
          </p>
        </div>
        <button type="button" onClick={handleRefresh} disabled={refreshing}
          className={`rounded-lg border p-2 transition ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'} ${refreshing ? 'opacity-50' : ''}`}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info */}
      <div className={`rounded-lg border p-4 ${isDark ? 'border-blue-900/50 bg-blue-950/30' : 'border-blue-200 bg-blue-50'}`}>
        <div className="flex items-start gap-2">
          <Info className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            <p>Select providers on the left, pick models on the right. Data from models.dev, cached 24h.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" /></div>
      ) : error ? (
        <div className={`rounded-lg border p-6 text-center ${isDark ? 'border-red-900 bg-red-950/50 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
          <p>{error}</p>
          <button type="button" onClick={loadProviders} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Providers */}
          <div className={`rounded-lg border p-4 ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-300 bg-zinc-200'}`}>
            <h3 className="mb-3 text-sm font-semibold">Providers</h3>
            <div className="relative mb-2">
              <input type="text" value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)}
                placeholder="Search..." className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'}`} />
            </div>
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {filteredProviders.map((provider) => {
                const isSelected = selectedProviderId === provider.id;
                const isPopular = popularProviders.includes(provider.id);
                const hasSelected = provider.models.some(m => selectedModels.has(m.id));
                return (
                  <button key={provider.id} type="button" onClick={() => setSelectedProviderId(provider.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      isSelected ? (isDark ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/50' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200')
                        : (isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700')
                    }`}>
                    <div className="flex items-center gap-2">
                      <span>{provider.name}</span>
                      {isPopular && <span className={`rounded px-1.5 py-0.5 text-xs ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>Popular</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasSelected && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                      <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{provider.models.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Models */}
          <div className={`lg:col-span-2 rounded-lg border p-4 ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-300 bg-zinc-200'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Models ({selectedModels.size} selected)</h3>
              <button type="button" onClick={() => setModelSearch(modelSearch === 'free' ? '' : 'free')}
                className={`rounded px-2 py-1 text-xs font-medium transition ${
                  modelSearch === 'free' ? (isDark ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50' : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300')
                    : (isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300')
                }`}>
                Free
              </button>
            </div>

            {selectedProvider && (
              <div className="relative mb-3">
                <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Filter models..." className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500' : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'}`} />
                {modelSearch && (
                  <button type="button" onClick={() => setModelSearch('')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            )}

            {!selectedProvider ? (
              <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
                Select a provider from the left
              </div>
            ) : (
              <div className="max-h-96 space-y-4 overflow-y-auto">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{selectedProvider.name}</h4>
                    <button type="button" onClick={toggleAllVisible}
                      className={`rounded px-2 py-1 text-xs font-medium transition ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>
                      {filteredModels.every(m => selectedModels.has(m.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  {filteredModels.length === 0 ? (
                    <p className={`text-center text-sm py-6 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No models match</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                      {filteredModels.map((model) => {
                        const isSelected = selectedModels.has(model.id);
                        return (
                          <button key={model.id} type="button" onClick={() => toggleModel(model.id)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                              isSelected ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-50 text-green-700')
                                : (isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700')
                            }`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                isSelected ? (isDark ? 'border-green-500 bg-green-500' : 'border-green-600 bg-green-600') : (isDark ? 'border-zinc-600' : 'border-zinc-300')
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate">{model.name}</div>
                                <div className={`truncate text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{model.id}</div>
                              </div>
                            </div>
                            {model.context_length && (
                              <span className={`ml-2 shrink-0 text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {(model.context_length / 1000).toFixed(0)}k
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
