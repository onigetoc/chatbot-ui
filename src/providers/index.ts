/**
 * Providers — main entry point.
 *
 * Usage:
 *   import { getProvider, getModel } from './providers';
 *
 *   // Get a configured provider instance (Vercel AI SDK)
 *   const provider = getProvider('opencode');
 *   const result = await generateText({ model: provider('claude-sonnet-5'), prompt: '...' });
 *
 *   // Or shorthand — resolve "opencode/claude-sonnet-5" into a model instance
 *   const model = getModel('opencode/claude-sonnet-5');
 *   const result = await generateText({ model, prompt: '...' });
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { PROVIDERS, type ProviderConfig } from './registry.js';
import { getKey } from './keys.js';

// Re-export everything for convenience
export { PROVIDERS, PROVIDER_IDS, isValidProvider, getEnvToProviderMap } from './registry.js';
export { getKey, saveKey, removeKey, hasKey, readAllKeys, scanEnvKeys } from './keys.js';
export { registerProviderRoutes } from './routes.js';
export type { ProviderConfig } from './registry.js';

/**
 * Create a Vercel AI SDK provider instance for the given provider ID.
 * Uses @ai-sdk/openai-compatible under the hood (works with any OpenAI-compatible API).
 *
 * @param providerId - e.g. 'opencode', 'anthropic', 'groq'
 * @param apiKey - optional override; if not provided, reads from stored keys
 * @returns A provider function you can call with a model slug
 *
 * @example
 *   const opencode = getProvider('opencode');
 *   const model = opencode('claude-sonnet-5');
 */
export function getProvider(providerId: string, apiKey?: string) {
  const config = PROVIDERS[providerId];
  if (!config) {
    throw new Error(`Unknown provider: ${providerId}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  const key = apiKey || getKey(providerId) || process.env[config.envVar];
  if (!key) {
    throw new Error(
      `No API key for provider "${providerId}". ` +
      `Set ${config.envVar} env var or add key via the UI.`
    );
  }

  return createOpenAICompatible({
    name: providerId,
    baseURL: config.baseURL,
    apiKey: key,
  });
}

/**
 * Resolve a full model ID ("provider/model-slug") into a Vercel AI SDK model instance.
 *
 * @param modelId - e.g. 'opencode/claude-sonnet-5', 'google/gemini-3-flash'
 * @returns A model instance ready for generateText/streamText
 *
 * @example
 *   import { generateText } from 'ai';
 *   const model = getModel('opencode/claude-sonnet-5');
 *   const { text } = await generateText({ model, prompt: 'Hello' });
 */
export function getModel(modelId: string) {
  const slashIndex = modelId.indexOf('/');
  if (slashIndex === -1) {
    throw new Error(`Invalid model ID "${modelId}". Expected format: "provider/model-slug"`);
  }

  const providerId = modelId.substring(0, slashIndex);
  const modelSlug = modelId.substring(slashIndex + 1);

  const provider = getProvider(providerId);
  return provider(modelSlug);
}

/**
 * List all providers that have a configured API key (ready to use).
 */
export function getConfiguredProviders(): string[] {
  return Object.keys(PROVIDERS).filter((id) => {
    const config = PROVIDERS[id];
    return !!(getKey(id) || process.env[config.envVar]);
  });
}
