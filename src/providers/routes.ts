/**
 * Provider API Routes — manage API keys from the web UI.
 *
 * Endpoints:
 *   GET  /auth/providers        — list all providers + configured status
 *   POST /auth/provider         — add/update a provider API key
 *   POST /auth/provider/remove  — remove a provider API key
 *   GET  /auth/scan             — scan system env vars for known keys
 *   POST /auth/scan/add         — import a scanned env key into storage
 *
 * Framework: Fastify. Adapt register function signature for Express/Hono.
 */
import { FastifyInstance } from 'fastify';
import { PROVIDERS, isValidProvider, getEnvToProviderMap } from './registry.js';
import { readAllKeys, saveKey, removeKey, scanEnvKeys } from './keys.js';

export function registerProviderRoutes(fastify: FastifyInstance, authenticate?: any): void {
  const preHandler = authenticate ? { preHandler: authenticate } : {};

  /** List all providers with their configured status */
  fastify.get('/auth/providers', preHandler, async () => {
    const stored = readAllKeys();
    const providers = Object.entries(PROVIDERS).map(([id, config]) => ({
      provider: id,
      label: config.label,
      placeholder: config.placeholder,
      url: config.url,
      configured: !!stored[id],
      isOAuth: config.isOAuth || false,
    }));
    return { providers };
  });

  /** Add or update a provider API key */
  fastify.post('/auth/provider', preHandler, async (request, reply) => {
    const body = request.body as Record<string, unknown> | undefined;
    const provider = (body?.provider as string || '').toLowerCase().trim();
    const key = (body?.key as string || '').trim();

    if (!provider || !key) {
      reply.code(400).send({ error: 'provider and key are required' });
      return;
    }

    if (!isValidProvider(provider)) {
      reply.code(400).send({ error: `Invalid provider. Allowed: ${Object.keys(PROVIDERS).join(', ')}` });
      return;
    }

    // Basic key format validation (alphanumeric + dashes/underscores/dots, 10-200 chars)
    if (!/^[a-zA-Z0-9_\-\.]{10,200}$/.test(key)) {
      reply.code(400).send({ error: 'Invalid API key format' });
      return;
    }

    saveKey(provider, key);
    return { success: true, provider, message: `${PROVIDERS[provider].label} key configured` };
  });

  /** Remove a provider API key */
  fastify.post('/auth/provider/remove', preHandler, async (request, reply) => {
    const body = request.body as Record<string, unknown> | undefined;
    const provider = (body?.provider as string || '').toLowerCase().trim();

    if (!isValidProvider(provider)) {
      reply.code(400).send({ error: 'Invalid provider' });
      return;
    }

    removeKey(provider);
    return { success: true, provider, message: `${PROVIDERS[provider].label} key removed` };
  });

  /** Scan system environment variables for known API keys */
  fastify.get('/auth/scan', preHandler, async () => {
    const envMap = getEnvToProviderMap();
    const keys = scanEnvKeys(envMap);
    // Attach labels
    const results = keys.map((k) => ({
      ...k,
      label: PROVIDERS[k.provider]?.label || k.provider,
    }));
    return { keys: results };
  });

  /** Import a scanned env key into persistent storage */
  fastify.post('/auth/scan/add', preHandler, async (request, reply) => {
    const body = request.body as Record<string, unknown> | undefined;
    const envVar = (body?.envVar as string || '').trim();

    const envMap = getEnvToProviderMap();
    const provider = envMap[envVar];

    if (!provider) {
      reply.code(400).send({ error: 'Unknown environment variable' });
      return;
    }

    const value = process.env[envVar];
    if (!value) {
      reply.code(404).send({ error: `${envVar} not found in system environment` });
      return;
    }

    saveKey(provider, value);
    return { success: true, provider, message: `${PROVIDERS[provider].label} key added from ${envVar}` };
  });
}
