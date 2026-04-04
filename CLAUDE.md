# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI SEO Extension is a Chrome browser extension (Manifest V3) that visualizes ChatGPT search patterns as interactive trees and allows users to re-fire selected prompts back to ChatGPT. It runs as a browser side panel.

## Commands

All commands run from the `extension/` directory using pnpm:

```bash
cd extension
pnpm dev        # Start Vite dev server with HMR (CRXJS plugin handles extension bundling)
pnpm build      # Type-check (tsc -b) then build to dist/
pnpm preview    # Preview built output
```

No test runner is configured yet.

## Architecture

### Monorepo Structure
- `extension/` — Chrome extension (active development)
- `web/` — Companion web app (minimal/stub)

### Extension Architecture

**Entry points:**
- `src/main.tsx` → React app (side panel UI)
- `src/background.ts` → Chrome service worker (opens side panel on icon click)

**Routing** (`src/App.tsx`): Hash router with 4 routes:
- `/` → `AuthPage` — mock OAuth flow via popup window + localStorage polling
- `/auth-callback` → `AuthCallback` — sets `ai-seo-auth` in localStorage, auto-closes
- `/dashboard` → `Dashboard` (protected) — session list with new session dialog
- `/visualization/:sessionId` → `VisualizationPage` (protected) — tree/list toggle

Auth state is stored in `localStorage` (`ai-seo-auth` key). Protected routes check this on mount.

**Data model** (`src/data/mockData.ts`):
```typescript
interface PromptNode {
  id: string;
  type: 'prompt' | 'subquery' | 'site' | 'generated';
  content: string;
  children?: PromptNode[];
  metadata?: { url?: string; keywords?: string[]; source?: string; };
}
interface Session { id: string; title: string; timestamp: string; rootPrompt: PromptNode; }
```

**Visualization** (`src/components/`):
- `TreeView.tsx` — ReactFlow graph with Dagre hierarchical layout (LR direction). Converts `PromptNode` tree to ReactFlow nodes/edges. Manages node selection state and calls `firePromptsInChatGPT()` on selection.
- `ListView.tsx` — Collapsible hierarchical list, auto-expands first 2 levels.
- `SelectionToolbar.tsx` — Floating fixed toolbar shown when nodes are selected.
- `nodes/` — Four custom ReactFlow node components (`PromptNode`, `SubqueryNode`, `SiteNode`, `GeneratedNode`), all memoized.

**ChatGPT automation** (`src/utils/chatgptAutomation.ts`):
- `firePromptsInChatGPT(prompts)` — opens one Chrome tab per prompt on `chat.openai.com`, injects a content script that finds the textarea (`data-id="root"`) and send button (`data-testid="send-button"`) and submits the prompt.
- Requires `scripting` + `tabs` permissions and `https://chat.openai.com/*` host permission.

### UI Stack
- **shadcn/ui** components in `src/components/ui/` — do not edit these manually; add new ones via the shadcn CLI pattern described in `components.json`
- **Tailwind CSS** with CSS variable-based design tokens (defined in `src/index.css`)
- **Design system**: Bold minimalist — `border-2`, `rounded-none`, uppercase tracking, high-contrast black/white, Lucide icons
- Path alias `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`)

### Chrome Extension Specifics
- Manifest V3 with `sidePanel`, `activeTab`, `tabs`, `scripting` permissions
- CRXJS Vite plugin handles extension bundling and HMR during dev
- Load the `extension/dist/` folder in Chrome via `chrome://extensions` → Load unpacked
- `dist.crx` and `dist.pem` are build artifacts (signing key) — do not delete `dist.pem`
