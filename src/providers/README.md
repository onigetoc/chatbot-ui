# Providers Module

Standalone module for managing AI provider API keys and model selection.  
Drop this folder into any project that needs multi-provider LLM support.

## Structure

```
providers/
├── index.ts              — Main export: getProvider(), getModel(), re-exports all
├── registry.ts           — Provider configs (label, baseURL, envVar, npm package)
├── keys.ts               — Read/write API keys (auth.json)
├── routes.ts             — Fastify API endpoints for key management
├── frontend/
│   ├── ApiKeysSection.tsx   — UI: add/remove/scan API keys
│   ├── ModelsSection.tsx    — UI: provider list + model picker + Free filter
│   └── models-cache.ts     — Fetch models.dev, localStorage cache
└── README.md
```

## Dependencies

### Backend
```bash
bun add @ai-sdk/openai-compatible ai
```

### Frontend
```bash
bun add react lucide-react
# + tailwindcss configured
```

## Backend Setup

### 1. Register routes (Fastify)

```typescript
import { registerProviderRoutes } from './providers';

// In your Fastify setup:
registerProviderRoutes(fastify, authenticate); // authenticate is optional
```

### 2. Use a provider in your chat handler

```typescript
import { generateText, streamText } from 'ai';
import { getModel } from './providers';

// User selects "opencode/claude-sonnet-5" in the UI
const model = getModel('opencode/claude-sonnet-5');

const { text } = await generateText({ model, prompt: userMessage });
// or
const stream = await streamText({ model, messages });
```

### 3. Check configured providers

```typescript
import { getConfiguredProviders, hasKey } from './providers';

const ready = getConfiguredProviders(); // ['google', 'opencode', ...]
if (!hasKey('anthropic')) console.log('No Anthropic key configured');
```

## Frontend Setup

### 1. Wire up ApiKeysSection

In `ApiKeysSection.tsx`, replace the placeholder `apiService` with your actual API calls:

```typescript
const apiService = {
  getAuthProviders: () => fetch('/auth/providers').then(r => r.json()).then(d => d.providers),
  setAuthProvider: (provider, key) => fetch('/auth/provider', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({provider, key}) }).then(r => r.json()),
  removeAuthProvider: (provider) => fetch('/auth/provider/remove', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({provider}) }).then(r => r.json()),
  scanApiKeys: () => fetch('/auth/scan').then(r => r.json()).then(d => d.keys),
  addScannedKey: (envVar) => fetch('/auth/scan/add', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({envVar}) }).then(r => r.json()),
};
```

### 2. Use ModelsSection

```tsx
import ModelsSection from './providers/frontend/ModelsSection';

<ModelsSection
  isDark={true}
  onModelsChanged={(models) => {
    // Save to backend, update app state, etc.
    console.log('Selected models:', models);
  }}
/>
```

### 3. Use ApiKeysSection

```tsx
import ApiKeysSection from './providers/frontend/ApiKeysSection';

<ApiKeysSection isDark={true} />
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/providers` | List all providers + configured status |
| POST | `/auth/provider` | Add/update key `{ provider, key }` |
| POST | `/auth/provider/remove` | Remove key `{ provider }` |
| GET | `/auth/scan` | Scan env vars for known API keys |
| POST | `/auth/scan/add` | Import env key `{ envVar }` |

## Key Storage

Keys stored in `~/.local/share/opencode/auth.json` (same as OpenCode CLI).  
Change `AUTH_PATH` in `keys.ts` if you want a different location.

## Adding a New Provider

1. Add entry to `PROVIDERS` in `registry.ts`
2. Done — frontend dropdown and backend whitelist both derive from that object.

## Model Data Source

Models fetched from `https://models.dev/api.json` (browser-side).  
Cached in localStorage for 24h. Refresh button clears cache.

## Adapting for Express/Hono

`routes.ts` uses Fastify. For Express:

```typescript
import express from 'express';
import { PROVIDERS, isValidProvider } from './providers/registry';
import { saveKey, removeKey, readAllKeys, scanEnvKeys } from './providers/keys';

const router = express.Router();

router.get('/auth/providers', (req, res) => {
  const stored = readAllKeys();
  const providers = Object.entries(PROVIDERS).map(([id, config]) => ({
    provider: id, label: config.label, configured: !!stored[id],
  }));
  res.json({ providers });
});

// ... same pattern for other routes
```
