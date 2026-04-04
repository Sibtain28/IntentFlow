# AI SEO Platform — Agent Context

This document is the single, detailed context handoff for any AI agent working in this repository.
It explains what the project is, how it is built, how data flows, what is already implemented, what is partially implemented, and what to avoid breaking.

Repository root:
- `/Users/abhishekverma/Desktop/Cluster/Projects/ai-seo`

Major workspaces:
- `/Users/abhishekverma/Desktop/Cluster/Projects/ai-seo/backend`
- `/Users/abhishekverma/Desktop/Cluster/Projects/ai-seo/web`
- `/Users/abhishekverma/Desktop/Cluster/Projects/ai-seo/extension`
- `/Users/abhishekverma/Desktop/Cluster/Projects/ai-seo/tasks`

---

## 1) What This Product Does

The product captures user intent and SERP-like signals from AI chat providers (currently ChatGPT, Claude, Perplexity), then persists that data as a deterministic campaign tree:
- `prompt`
- `subquery`
- `site`

It also supports:
- campaign versioning and refire
- suggestion generation using queued SEMrush/Ahrefs enrichment
- analytics event capture
- lead-intelligence primitives
- admin analytics views with RBAC

Primary value:
- convert raw AI-search behavior into actionable SEO planning and lead intelligence.

---

## 2) Technical Stack

### Backend (`backend`)
- Node.js + TypeScript
- Express 4
- Prisma ORM + PostgreSQL
- Zod DTO validation
- JWT auth
- BullMQ queues + Redis

Key backend packages:
- `express`, `@prisma/client`, `prisma`, `zod`, `jsonwebtoken`, `bullmq`

### Web (`web`)
- React 19 + TypeScript + Vite
- React Router
- Radix UI primitives + shadcn-style components
- Tailwind CSS
- Recharts for charts
- XYFlow for campaign graph visualization

### Extension (`extension`)
- Chrome Extension Manifest V3
- React + TypeScript + Vite + CRXJS
- Side panel UI
- Background service worker
- Content scripts for provider stream interception

---

## 3) UI/Design System Notes

Both web and extension use a shadcn-style component layer over Radix primitives:
- web UI components: `/web/src/shared/components/ui/*`
- extension UI components: `/extension/src/components/ui/*`

Design patterns currently used:
- utility-first Tailwind
- Radix-based dialogs/tabs/dropdowns/scroll areas
- Sonner toasts
- dark, data-dense operator UI patterns

Do not introduce a separate UI framework. Follow existing shadcn/radix style and component organization.

---

## 4) Current Product Surfaces

### 4.1 Web app
Main routes in `/web/src/App.tsx`:
- public:
  - `/sign-in`
  - `/auth/callback`
  - `/extension/connect`
  - `/onboarding`
- authenticated app layout:
  - `/` dashboard
  - `/campaign/:id/graph`
  - `/campaign/:id/list`
- admin pages (guarded by admin route):
  - `/admin`
  - `/admin/users`
  - `/admin/events`
  - `/admin/signals`

App layout behavior in `/web/src/pages/app-layout.tsx`:
- redirects non-admin users with no campaigns to onboarding
- redirects admin users landing on `/` to `/admin`

### 4.2 Extension
Manifest: `/extension/manifest.json`
- side panel extension
- background service worker: `src/background.ts`
- content scripts for:
  - ChatGPT (`chatgptStreamMain.ts` + `chatgptStreamContent.ts`)
  - Claude (`claudeStreamMain.ts` + `claudeStreamContent.ts`)
  - Perplexity (`perplexityStreamMain.ts` + `perplexityStreamContent.ts`)

Provider hosts currently allowed:
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://claude.ai/*`
- `https://www.perplexity.ai/*`
- `https://perplexity.ai/*`

Key extension pages:
- auth page
- dashboard
- visualization page (`/visualization/:sessionId`) for live + persisted tree flow
  - this now uses a compact deterministic explorer (prompt -> subquery -> site/evidence) as the primary interaction surface, not the older deeply nested list as the main path

### 4.3 Backend routes (registered in `/backend/src/loaders/express.ts`)
- `/api/auth/*`
- `/api/onboarding/*`
- `/api/campaigns/*`
- `/api/users/*`
- `/api/admin/users/*` (role operations)
- `/api/analytics/*`

---

## 5) Data Model (Prisma)

Schema file:
- `/backend/prisma/schema.prisma`

Important models:
- `User`
- `Tenant`, `TenantMember`
- `Campaign`, `CampaignVersion`
- `CaptureSession`, `CaptureTurn`
- `PromptNode`
- `SemrushSnapshot`, `GenerationRun`
- `AnalyticsEvent`
- `LeadSignal`

Important enums:
- `AiChatProvider`
- `NodeType`
- `CampaignVersionStatus`
- `RunStatus`
- `AppRole` (`admin`, `user`)

Notable user enrichment/lead fields on `User`:
- `app_role`
- `company_name`, `company_domain`
- `linkedin_url`, `x_url`, `other_social_urls`
- `timezone`, `locale`, `job_role`
- `lead_score_current`, `lead_segment`, `lead_score_updated_at`, `scoring_model_version`

Capture-related structure:
- one `CaptureSession` per provider conversation within campaign version
- one `CaptureTurn` per captured user turn
- multiple `PromptNode` entries materialized from turn events

---

## 6) Core Business Flow

### 6.1 Authentication
1. User signs in via Google OAuth or email/password.
2. Backend issues JWT access + refresh token.
3. Payload includes tenant and app role.
4. Web/extension store session in local storage.

Backend auth source:
- `/backend/src/modules/auth/auth.service.ts`

### 6.2 Campaign lifecycle
1. User creates campaign.
2. Active version is established (`v1` initially).
3. Stream captures append nodes into selected version.
4. Refire creates new version by cloning source version nodes.

Core files:
- `/backend/src/modules/campaign/campaign.controller.ts`
- `/backend/src/modules/campaign/campaign.service.ts`
- `/backend/src/modules/campaign/campaign.repository.ts`

### 6.3 Stream capture lifecycle (extension -> backend)
1. Provider page streams are intercepted by MAIN-world content script.
2. MAIN script emits minimal bridge payload via `window.postMessage`.
3. Isolated content script forwards to background via runtime port.
4. Background aggregates per-turn data and forwards to visualization UI.
5. Visualization page builds RAM preview tree.
6. Visualization persists captured turn to backend ingest endpoint.
7. Backend normalizes facts, persists `CaptureTurn.raw_event_json`, then materializes deterministic tree nodes.
8. UI refreshes from DB-authoritative tree.

Important files:
- `/extension/src/content/chatgptStreamMain.ts`
- `/extension/src/content/claudeStreamMain.ts`
- `/extension/src/content/perplexityStreamMain.ts`
- `/extension/src/background.ts`
- `/extension/src/pages/VisualizationPage.tsx`
- `/backend/src/modules/campaign/campaign.service.ts` (ingest path)

### 6.4 Suggestion generation
1. User triggers suggestion generation for campaign/version.
2. Backend collects unique site nodes.
3. Backend enqueues SEMrush job; fallback to Ahrefs job if needed.
4. Resulting insights are used to generate suggestion prompt nodes (`NodeType.generated`).
5. Generation run is tracked in `GenerationRun`.

Queue files:
- `/backend/src/queue/semrush.queue.ts`
- `/backend/src/queue/ahrefs.queue.ts`
- `/backend/src/queue/workers/*`

### 6.5 Node refresh + refire replay (current operational behavior)
1. User triggers refire from extension visualization.
2. Extension reads source version prompt nodes and determines provider per node from lineage metadata.
3. Extension creates next campaign version via refire API.
4. Extension replays prompt execution sequentially provider-by-provider (ChatGPT/Claude/Perplexity), captures stream, and ingests into the newly selected version.
5. Execution UI tracks progress with provider badges and running status.
6. For node refresh action, extension first records refresh metadata through backend node-refresh endpoint, then executes provider fire flow for that node context.

Important caveat:
- backend `refresh_node` endpoint currently updates deterministic refresh metadata and audit fields; full provider replay execution is extension-orchestrated.

---

## 7) Deterministic Tree Mapping Rules (Critical)

These are stability-critical and should not be regressed:
- each turn maps to one prompt root for that capture turn
- subqueries are deduped/ordered by first seen sequence
- sites are deduped and attached to correct subquery
- unscoped results are attached under `__unscoped__`/unmapped path when needed
- provider noise/internal pseudo-sites should be filtered
- final UI should rely on DB-authoritative tree after save

Ingest implementation lives in:
- `/backend/src/modules/campaign/campaign.service.ts`

Also note:
- extension deliberately trims heavy result-group payload before ingest in some paths (`trim_result_groups`) to avoid tree bloat
- snippets/large text should be stored as analytics facts if needed, not exploded into noisy tree nodes

---

## 8) Versioning and Refire

Versioning behavior:
- campaign has multiple versions
- one active version at a time
- web and extension can request tree by `version_id`

Refire behavior:
- selects source version by `version_number`
- archives currently active version
- creates next version number
- clones source prompt nodes preserving hierarchy

Main logic:
- `/backend/src/modules/campaign/campaign.repository.ts` (`refireVersion`)

---

## 9) RBAC and Admin Surface (Current State)

### Backend RBAC
- auth middleware attaches `app_role` from JWT payload
- role guard middleware: `requireRole(requiredRole)`
- analytics admin endpoints are guarded

Files:
- `/backend/src/middlewares/auth.middleware.ts`
- `/backend/src/middlewares/require-role.middleware.ts`
- `/backend/src/modules/analytics/analytics.controller.ts`

Role management endpoint exists:
- `POST /api/admin/users/:userId/role` (admin only)
- file: `/backend/src/modules/auth/roles.controller.ts`

### Web RBAC
- admin-only route wrapper in `AdminRoute`
- admin nav sections and pages implemented
- admin users redirected to `/admin` on app root

Files:
- `/web/src/shared/components/admin-route.tsx`
- `/web/src/pages/admin-dashboard.tsx`
- `/web/src/pages/admin-users-page.tsx`
- `/web/src/pages/admin-events-page.tsx`
- `/web/src/pages/admin-signals-page.tsx`
- `/web/src/pages/app-layout.tsx`

### Extension RBAC
- extension receives/stores user object with role from auth payload
- role-specific extension feature gating is still less mature than web/backend and should be treated as an area to harden

---

## 10) Analytics and Lead Intelligence (Current State)

### Analytics capture
Backend endpoint:
- `POST /api/analytics/events`

Admin analytics endpoints:
- `GET /api/analytics/admin/stats`
- `GET /api/analytics/admin/users`
- `GET /api/analytics/admin/events`
- `GET /api/analytics/admin/signals`
- `POST /api/analytics/cleanup` (admin)

Service file:
- `/backend/src/modules/analytics/analytics.service.ts`

PII scrubbing exists in analytics service for common keys.

### Client-side analytics emitters
Web:
- `/web/src/shared/hooks/use-web-analytics.ts`
- `/web/src/shared/lib/analytics.ts`

Extension:
- `/extension/src/hooks/use-extension-analytics.ts`
- `/extension/src/lib/api.ts` (`analytics_api.track_event`)
- additional tracking calls in background and visualization flow

### Lead signals
- `LeadSignal` model exists and admin list endpoint exists
- extraction/scoring sophistication is still evolving and must remain backward compatible

---

## 11) API/Data Naming Convention

Use `snake_case` consistently for:
- Prisma fields
- API payload keys
- persisted metadata keys
- queue payload keys

This is an explicit repo-level rule in task docs.

---

## 12) Environment and Runtime

Backend env key examples (see `/backend/.env.example` and README):
- `PORT`, `DATABASE_URL`
- `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `OAUTH_DEFAULT_EXTENSION_REDIRECT_URI`
- `CORS_ALLOWED_ORIGINS`
- `SEMRUSH_URL`, `AHREFS_URL` (if enabled)
- `OPENAI_API_KEY`, `OPENAI_MODEL` (if generation/intelligence paths use model calls)

Queue workers start via backend boot:
- `init_queue_workers()` in `/backend/src/server.ts`

---

## 13) Build and Verification Commands

Backend:
- `cd backend && pnpm dev`
- `cd backend && pnpm build`
- `cd backend && pnpm prisma:generate`
- `cd backend && pnpm prisma:push` (or migrate)

Web:
- `cd web && pnpm dev`
- `cd web && pnpm build`

Extension:
- `cd extension && pnpm dev`
- `cd extension && pnpm build`

Always run build for touched surface(s) before concluding work.

---

## 14) Current Task Documentation

Task workspace:
- `/tasks/README.md`

Important active task docs:
- `/tasks/11-provider-stream-deterministic-mapping/plan.md`
- `/tasks/12-data-capture-lead-intelligence/plan.md`
- `/tasks/12-data-capture-lead-intelligence/progress.md`

Task 12 includes:
- expanded data capture roadmap
- lead intelligence roadmap
- RBAC hardening + admin dashboard requirements

---

## 15) Known Risk Areas / Common Regressions

1. RAM-only data appears then disappears after DB reload
- Usually caused by mismatch between parser payload and backend materialization expectations.

2. Wrong parent mapping in tree
- Usually when subquery linkage is missing or inferred inconsistently across providers.

3. Over-bloated metadata
- Inserting large snippets/raw blobs directly into tree nodes makes UI noisy and persistence heavy.

4. Role checks only in UI
- Must enforce on backend; UI-only guards are insufficient.

5. Provider domain edge cases
- Perplexity includes both `www` and non-`www` hosts; keep both in manifest and injection logic.

---

## 16) Practical Agent Guardrails

When changing this repo:
- preserve deterministic capture behavior first
- prefer additive migrations and backward-compatible DTO/API changes
- do not remove existing queue-based suggestion path
- do not break admin route guards or backend require-role checks
- keep heavy analytics data separate from display tree
- do not revert unrelated user changes

If working on capture logic, inspect both:
- provider parser output shape (content scripts)
- ingest normalization/materialization (backend service)

If working on RBAC, verify all three surfaces:
- backend authorization
- web route guards/navigation
- extension capability gating and API usage

---

## 17) High-Level Architecture Summary (One Screen)

1) User authenticates (web or extension OAuth/email)
2) Campaign created (tenant-scoped, versioned)
3) Extension listens to provider stream events
4) Extension aggregates + previews tree in RAM
5) Extension posts normalized turn payload to backend ingest
6) Backend persists turn facts + materializes deterministic nodes
7) Web/extension render DB tree by campaign/version
8) Suggestions use queued SEMrush/Ahrefs jobs
9) Analytics events accumulate for admin/lead insights
10) RBAC controls admin/user access across ecosystem

---

## 18) Source-of-Truth Files to Read First

If you are new to this codebase, start here in order:
1. `/backend/prisma/schema.prisma`
2. `/backend/src/loaders/express.ts`
3. `/backend/src/modules/auth/auth.service.ts`
4. `/backend/src/modules/campaign/campaign.service.ts`
5. `/extension/manifest.json`
6. `/extension/src/background.ts`
7. `/extension/src/pages/VisualizationPage.tsx`
8. `/extension/src/components/CompactTreeExplorer.tsx`
9. `/extension/src/components/ExecutionDrawer.tsx`
10. `/web/src/App.tsx`
11. `/web/src/pages/app-layout.tsx`
12. `/web/src/pages/campaign-list-page.tsx`
13. `/tasks/11-provider-stream-deterministic-mapping/plan.md`
14. `/tasks/12-data-capture-lead-intelligence/plan.md`

---

## 19) Latest Implemented Approach (Deterministic Mapping + UX Revamp)

This section reflects the latest approach now used in code.

### A) Deterministic node contract (backend)
- Tree responses now carry canonical node metadata (not ad-hoc parser-specific fields):
  - refs: `prompt_ref`, `subquery_ref`, `result_ref`, `query_key`
  - lineage: `capture_turn_id`, `origin_provider`, `origin_request_id`, `source_version_id`
  - refresh: `refreshable`, `refresh_count`, `refresh_status`, `last_refreshed_at`, `last_refresh_run_id`, `refresh_provider`
  - ui: `display_label`, `is_unmapped`, `is_system`
- File: `/backend/src/modules/campaign/campaign.service.ts` (`getActiveTree` projection + ingest metadata population)

### B) Refresh primitive (backend API)
- New endpoint:
  - `POST /api/campaigns/:campaign_id/nodes/:node_id/refresh?version_id=...`
- Stores deterministic refresh metadata updates on the target node.
- Files:
  - `/backend/src/modules/campaign/campaign.routes.ts`
  - `/backend/src/modules/campaign/campaign.controller.ts`
  - `/backend/src/modules/campaign/campaign.service.ts`
  - `/backend/src/modules/campaign/dto/campaign.dto.ts`

### C) Refire behavior (extension orchestration)
- Refire is no longer clone-only UX-wise.
- New flow in extension:
  1. Read source-version prompt nodes.
  2. Build replay tasks from prompt nodes using stored lineage provider.
  3. Create new version via refire API.
  4. Replay prompts sequentially through provider tabs (ChatGPT/Claude/Perplexity automation).
  5. Capture + ingest each turn into the newly selected version.
- Critical fix:
  - ingest now uses latest selected version ref to avoid stale closure targeting old version.
- File: `/extension/src/pages/VisualizationPage.tsx`

### D) Extension UX model (compact stepwise explorer)
- Replaced dense nested tree as primary interaction.
- New component:
  - `/extension/src/components/CompactTreeExplorer.tsx`
- Stepwise sections with separators:
  - Step 1: Select Prompt
  - Step 2: Select Subquery
  - Step 3: Inspect Sites & Evidence
- Actions integrated at context level:
  - Fire subquery
  - Refresh subquery node
  - Refresh prompt branch
- Execution progress rail supports cancel, running index, and auto-scroll to active item for long replay batches.

### E) Execution UX improvements
- Execution drawer auto-scrolls to active/current prompt while batch runs.
- Provider badge is now reusable with logo + provider name:
  - `/extension/src/components/ProviderBadge.tsx`
  - used in `/extension/src/components/ExecutionDrawer.tsx`

### F) Web UX model (3-panel list workspace)
- Campaign list route now follows structured 3-pane analysis:
  - Left: prompts
  - Middle: subqueries
  - Right: sites + evidence
- File:
  - `/web/src/pages/campaign-list-page.tsx`
- Route entry point:
  - `/campaign/:id/list`
- Graph route remains available at:
  - `/campaign/:id/graph`

### G) Contract sync updates
- Chat thread payload standardized with `chat_thread_id` and consistent shape.
- Files:
  - `/backend/src/modules/campaign/campaign.repository.ts`
  - `/backend/src/modules/campaign/campaign.service.ts`

### H) Where to continue next
- Make refresh endpoint execute full provider replay server-driven (queue/run model), not metadata-only update.
- Unify provider badges across all extension/web spots still using plain text labels.
- Add branch/node refresh controls in web 3-panel UI parity with extension actions.
- Improve visual separation and density in compact extension explorer so prompt/subquery/site sections remain obvious at narrow width (400-700px), reducing cognitive load in deep-drill sessions.
