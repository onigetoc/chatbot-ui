import { useState, useEffect, useCallback } from 'react'
import type { ModelInfo } from '../types'
import { getModelsDevData, loadSelections, type ModelsDevData } from '../providers/frontend/models-cache'

const DEFAULT_MODELS: ModelInfo[] = [
  { id: 'google/gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'Google', providerId: 'google' },
]

/** Custom event dispatched when models selection changes */
export const MODELS_CHANGED_EVENT = 'models-selection-changed'

/**
 * Build a lookup map: "providerId/modelSlug" → { name, providerName }
 * Only indexes models under their own provider — no cross-provider duplication.
 */
function buildModelLookup(data: ModelsDevData): Map<string, { name: string; providerName: string; providerId: string }> {
  const map = new Map<string, { name: string; providerName: string; providerId: string }>()

  for (const [providerId, providerData] of Object.entries(data)) {
    for (const [modelKey, model] of Object.entries(providerData.models)) {
      // The canonical ID for this model under THIS provider
      const canonicalId = `${providerId}/${modelKey}`
      map.set(canonicalId, {
        name: model.name,
        providerName: providerData.name,
        providerId,
      })

      // Also index by the model's own id field if it differs
      const altId = model.id.includes('/') ? model.id : `${providerId}/${model.id}`
      if (!map.has(altId)) {
        map.set(altId, {
          name: model.name,
          providerName: providerData.name,
          providerId,
        })
      }
    }
  }

  return map
}

/**
 * Returns only the models the user has selected in Settings > Models.
 * Reads from localStorage selections + cached models.dev data.
 * Falls back to DEFAULT_MODELS if no selections exist yet.
 */
export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSelectedModels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const selections = loadSelections()

      // If user hasn't selected anything yet, show defaults
      if (selections.models.length === 0) {
        setModels(DEFAULT_MODELS)
        setLoading(false)
        return
      }

      // Load models.dev data from cache (no network if already cached)
      const modelsDevData = await getModelsDevData()
      const lookup = buildModelLookup(modelsDevData)

      // Only include models that are EXACTLY in the selections list
      const selectedModels: ModelInfo[] = []
      const seen = new Set<string>()

      for (const selectedId of selections.models) {
        // Skip duplicates
        if (seen.has(selectedId)) continue
        seen.add(selectedId)

        const info = lookup.get(selectedId)
        if (info) {
          selectedModels.push({
            id: selectedId,
            name: info.name,
            provider: info.providerName,
            providerId: info.providerId,
          })
        } else {
          // Model not found in cache — parse from ID
          const slashIdx = selectedId.indexOf('/')
          const providerId = slashIdx !== -1 ? selectedId.substring(0, slashIdx) : 'unknown'
          const modelSlug = slashIdx !== -1 ? selectedId.substring(slashIdx + 1) : selectedId
          selectedModels.push({
            id: selectedId,
            name: modelSlug,
            provider: providerId,
            providerId,
          })
        }
      }

      if (selectedModels.length > 0) {
        setModels(selectedModels)
      } else {
        setModels(DEFAULT_MODELS)
      }
    } catch (err) {
      setError((err as Error).message)
      setModels(DEFAULT_MODELS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSelectedModels()

    // Listen for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'providers_models_selections') {
        loadSelectedModels()
      }
    }

    // Listen for same-tab custom event (dispatched by ModelsSection)
    const handleCustom = () => { loadSelectedModels() }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(MODELS_CHANGED_EVENT, handleCustom)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(MODELS_CHANGED_EVENT, handleCustom)
    }
  }, [loadSelectedModels])

  return { models, loading, error, refresh: loadSelectedModels }
}
