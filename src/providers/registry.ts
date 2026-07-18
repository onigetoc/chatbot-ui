/**
 * Provider Registry — config for each supported AI provider.
 *
 * Each entry maps a provider ID to its display info, env var name,
 * API base URL, and the @ai-sdk npm package to use.
 *
 * Add/remove providers here — frontend dropdown + backend whitelist
 * both derive from this single source of truth.
 */

export interface ProviderConfig {
  /** Human-readable label */
  label: string;
  /** Placeholder shown in the API key input */
  placeholder: string;
  /** URL to get an API key */
  url: string;
  /** Environment variable name for this provider's key */
  envVar: string;
  /** @ai-sdk npm package (for Vercel AI SDK) */
  npm: string;
  /** Base URL for the provider's API (used with openai-compatible) */
  baseURL: string;
  /** Whether this provider uses OAuth instead of a paste-able key */
  isOAuth?: boolean;
}

/**
 * All supported providers.
 * Order = display order in the frontend dropdown.
 */
export const PROVIDERS: Record<string, ProviderConfig> = {
  anthropic: {
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    url: 'https://console.anthropic.com/',
    envVar: 'ANTHROPIC_API_KEY',
    npm: '@ai-sdk/anthropic',
    baseURL: 'https://api.anthropic.com/v1',
  },
  google: {
    label: 'Google (Gemini)',
    placeholder: 'AIza...',
    url: 'https://aistudio.google.com/app/apikey',
    envVar: 'GOOGLE_API_KEY',
    npm: '@ai-sdk/google',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  },
  openai: {
    label: 'OpenAI (GPT)',
    placeholder: 'sk-...',
    url: 'https://platform.openai.com/api-keys',
    envVar: 'OPENAI_API_KEY',
    npm: '@ai-sdk/openai',
    baseURL: 'https://api.openai.com/v1',
  },
  opencode: {
    label: 'OpenCode (Zen)',
    placeholder: '',
    url: 'https://opencode.ai/auth',
    envVar: 'OPENCODE_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://opencode.ai/api/v1',
  },
  groq: {
    label: 'Groq',
    placeholder: 'gsk_...',
    url: 'https://console.groq.com/keys',
    envVar: 'GROQ_API_KEY',
    npm: '@ai-sdk/groq',
    baseURL: 'https://api.groq.com/openai/v1',
  },
  mistral: {
    label: 'Mistral',
    placeholder: '',
    url: 'https://console.mistral.ai/api-keys/',
    envVar: 'MISTRAL_API_KEY',
    npm: '@ai-sdk/mistral',
    baseURL: 'https://api.mistral.ai/v1',
  },
  cohere: {
    label: 'Cohere',
    placeholder: '',
    url: 'https://dashboard.cohere.com/api-keys',
    envVar: 'COHERE_API_KEY',
    npm: '@ai-sdk/cohere',
    baseURL: 'https://api.cohere.ai/v1',
  },
  deepseek: {
    label: 'DeepSeek',
    placeholder: 'sk-...',
    url: 'https://platform.deepseek.com/api_keys',
    envVar: 'DEEPSEEK_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://api.deepseek.com/v1',
  },
  xai: {
    label: 'xAI (Grok)',
    placeholder: 'xai-...',
    url: 'https://console.x.ai/',
    envVar: 'XAI_API_KEY',
    npm: '@ai-sdk/xai',
    baseURL: 'https://api.x.ai/v1',
  },
  openrouter: {
    label: 'OpenRouter',
    placeholder: 'sk-or-...',
    url: 'https://openrouter.ai/keys',
    envVar: 'OPENROUTER_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://openrouter.ai/api/v1',
  },
  together: {
    label: 'Together AI',
    placeholder: '',
    url: 'https://api.together.xyz/settings/api-keys',
    envVar: 'TOGETHER_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://api.together.xyz/v1',
  },
  fireworks: {
    label: 'Fireworks AI',
    placeholder: '',
    url: 'https://fireworks.ai/account/api-keys',
    envVar: 'FIREWORKS_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://api.fireworks.ai/inference/v1',
  },
  perplexity: {
    label: 'Perplexity',
    placeholder: 'pplx-...',
    url: 'https://www.perplexity.ai/settings/api',
    envVar: 'PERPLEXITY_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://api.perplexity.ai',
  },
  cerebras: {
    label: 'Cerebras',
    placeholder: '',
    url: 'https://cloud.cerebras.ai/',
    envVar: 'CEREBRAS_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://api.cerebras.ai/v1',
  },
  sambanova: {
    label: 'SambaNova',
    placeholder: '',
    url: 'https://cloud.sambanova.ai/',
    envVar: 'SAMBANOVA_API_KEY',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://api.sambanova.ai/v1',
  },
};

/** All provider IDs (for validation) */
export const PROVIDER_IDS = Object.keys(PROVIDERS);

/** Check if a provider ID is valid */
export function isValidProvider(id: string): boolean {
  return id in PROVIDERS;
}

/** Get the env var → provider ID mapping (for scanning system env) */
export function getEnvToProviderMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [id, config] of Object.entries(PROVIDERS)) {
    map[config.envVar] = id;
  }
  // Google has two possible env vars
  map['GEMINI_API_KEY'] = 'google';
  return map;
}
