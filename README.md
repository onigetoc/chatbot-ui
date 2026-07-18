# Chatbot UI

A multi-provider AI chat interface built with React, TypeScript, Vite, and Tailwind CSS. Connect to any OpenAI-compatible LLM provider (Google Gemini, OpenAI, Anthropic, Groq, Mistral, DeepSeek, and more) with a clean, modern UI.

## Features

- **Multi-provider support** — Connect to 15+ LLM providers via OpenAI-compatible API
- **Model selector** — Browse and pick models from models.dev catalog, cached 24h
- **Conversation management** — Create, rename, and delete conversations from the sidebar
- **Editable chat header** — Rename the active conversation directly from the chat area
- **Context menu** — Right-click (or hover ⋯) on sidebar chats to rename or delete
- **File & image attachments** — Drag-and-drop, paste, or pick files to include in messages
- **Markdown rendering** — Messages rendered with full markdown and syntax-highlighted code blocks
- **Dark / Light theme** — Toggle between themes, persisted across sessions
- **Internationalization (i18n)** — Full English and French translations, auto-detected from OS/browser language
- **Settings panel** — Three tabs: General (language), Models (provider/model selection), API Keys (manage keys)
- **System key detection** — Scan host environment variables for known API keys
- **Responsive design** — Collapsible sidebar for mobile, fluid layout for desktop
- **Local storage persistence** — Conversations, theme, model selection, and language all persisted in the browser

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (for the dev server) or Node.js 18+
- A free Google Gemini API key from [AI Studio](https://aistudio.google.com/api-keys)

### Install & Run

```bash
# Install dependencies
bun install
# or
npm install

# Start development (client + server)
bun run dev
```

This starts:
- Vite dev server on `http://localhost:3000`
- Hono API server on `http://localhost:3001`

### First-time Setup

1. Open the app at `http://localhost:3000`
2. Click **Models & Settings** in the sidebar (or the gear icon)
3. Go to the **API Keys** tab
4. Select **Google (Gemini)** and paste your free API key from [AI Studio](https://aistudio.google.com/api-keys)
5. Start chatting — the default model is `Gemini 3.1 Flash Lite`

### Free Models (as of July 2025)

Google offers a free tier for some Gemini models via AI Studio API keys. Currently known free models:

| Model | Status |
|-------|--------|
| `gemini-3.1-flash-lite` | Free, stable (default) |
| `gemini-2.5-flash` | Free, but may be unreliable |

Free tier availability changes over time — check [Google AI pricing](https://ai.google.dev/pricing) for the latest. Other providers (Groq, Cerebras, SambaNova) also offer free tiers for select models.

## Project Structure

```
chatbot-ui/
├── server/                  # Hono backend (Bun runtime)
│   ├── index.ts             # Server entry point
│   └── routes/
│       ├── chat.ts          # /api/chat streaming endpoint
│       ├── keys.ts          # /api/keys/scan & add endpoints
│       └── models.ts        # /api/models endpoint
├── src/                     # React frontend
│   ├── components/
│   │   ├── ChatArea.tsx     # Main chat view
│   │   ├── ChatHeader.tsx   # Editable conversation title header
│   │   ├── CodeBlock.tsx    # Syntax-highlighted code blocks
│   │   ├── ComposerBar.tsx  # Message input with attachments
│   │   ├── GeneralSettings.tsx # Language selector
│   │   ├── MessageBubble.tsx   # Message rendering
│   │   ├── ModelSelector.tsx   # Model dropdown
│   │   ├── SettingsPanel.tsx   # Settings dialog (General, Models, Keys)
│   │   ├── Sidebar.tsx         # Conversation list + context menu
│   │   └── Toast.tsx           # Notification toasts
│   ├── hooks/
│   │   └── useModels.ts     # Selected models hook
│   ├── locales/
│   │   ├── en.json          # English translations
│   │   └── fr.json          # French translations
│   ├── providers/
│   │   └── frontend/        # Provider UI components & cache
│   ├── store/
│   │   └── chatStore.ts     # Zustand store (conversations, theme, model)
│   ├── i18n.ts              # i18next configuration
│   ├── App.tsx              # Root layout
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State | Zustand (persisted to localStorage) |
| AI SDK | Vercel AI SDK (`ai` package) |
| Backend | Hono (on Bun) |
| i18n | react-i18next + browser language detection |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm + react-syntax-highlighter |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start client + server concurrently |
| `bun run dev:client` | Vite dev server only (port 3000) |
| `bun run dev:server` | Hono API server only (port 3001) |
| `bun run build` | TypeScript check + Vite production build |
| `bun run lint` | ESLint |
| `bun run preview` | Preview production build |

## Environment Variables

Create a `.env` file (optional — keys can also be added via the UI):

```env
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_key
# ... any provider key following the pattern PROVIDER_API_KEY
```

The server can detect these via the **Scan API Keys** feature in Settings.

## Adding a New Language

1. Create `src/locales/{code}.json` with translations (copy `en.json` as template)
2. Add the language to `src/i18n.ts` resources and `supportedLngs`
3. Add an option in `src/components/GeneralSettings.tsx`

## License

Private project.
