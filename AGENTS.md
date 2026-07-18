# chatbot-ui

React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 3 multi-provider AI chat UI.

## Quick start

```bash
bun install
# Copy .env.example to .env and add at least GOOGLE_GENERATIVE_AI_API_KEY
bun run dev        # runs both Hono server (:3001) + Vite client (:3000)
bun run dev:client # Vite only
bun run dev:server # Hono server only (with --watch)
bun run build      # tsc -b && vite build
bun run lint       # eslint .
bun run kill       # Kill port 3000, 3001, 3002, 3003
```

## Architecture

- **`/src`** — React client (entrypoint: `src/main.tsx`). Zustand store persisted as `chatbot-ui-snapshot` in localStorage.
- **`/server`** — Hono backend with two routes: `POST /api/chat` (streams AI responses via Vercel AI SDK `streamText`) and `GET /api/models` (fetches `https://models.dev/api.json`, cached 1h, falls back to `models-fallback.json`).
- **`/src/providers`** — standalone module for multi-provider AI support (15 providers in `registry.ts`). This module has server-side files (`index.ts`, `keys.ts`, `routes.ts`) that are explicitly excluded from the client-side `tsconfig.app.json` because they use Node.js APIs (fs, os, path). Only the `frontend/` subdirectory is used by the React app.
- Vite proxies `/api/*` → `http://localhost:3001`.

## API key management

- Keys stored at `~/.local/share/opencode/auth.json` (via `src/providers/keys.ts`).
- Can also be set via `.env` variables (see `.env.example`).
- UI manages keys through Settings > API Keys tab.

## TypeScript conventions

- `verbatimModuleSyntax: true` — use `import type` for type-only imports.
- `erasableSyntaxOnly: true` — no enums, no namespaces, no `experimentalDecorators`.
- `noUnusedLocals` + `noUnusedParameters` both `true`.
- Separate tsconfigs: `tsconfig.app.json` (`src/`), `tsconfig.node.json` (`vite.config.ts`), root `tsconfig.json` just references them.

## No tests

No test framework or test files exist in this repository.

## Streaming

Chat uses `useChat` from `ai/react` hitting `POST /api/chat`. The server uses `streamText` from Vercel AI SDK v4. All providers use `@ai-sdk/openai-compatible` — the server constructs provider instances with `createOpenAICompatible(...)` and a base URL map in `server/routes/chat.ts:11-27`.

## Internationalization (i18n)

- Uses `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- Initialized in `src/i18n.ts` — imported in `src/main.tsx` before the app renders.
- Language detected from localStorage first (`chatbot-ui-language`), then navigator.
- Translations stored in `src/locales/` as JSON (`en.json`, `fr.json`). Add new locale files and register them in `src/i18n.ts`.
- Language selector in Settings > General.
- `erasableSyntaxOnly` note: i18n does not use enums/namespaces, compatible.

## Components

- **`ChatHeader`** (`src/components/ChatHeader.tsx`) — top bar in ChatArea showing active conversation title with inline rename (click pencil icon, Enter to save, Escape to cancel, blur to save).
- **`GeneralSettings`** (`src/components/GeneralSettings.tsx`) — Settings tab for language selection. Rendered in `SettingsPanel.tsx` as the first tab.
- **`ConversationContextMenu`** (inline in `Sidebar.tsx`) — per-conversation menu with rename and delete actions, triggered by `MoreHorizontal` button on hover.
- **`renameConversation`** action added to `chatStore.ts` — updates title and `updatedAt` on matching conversation.

## Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes, derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
