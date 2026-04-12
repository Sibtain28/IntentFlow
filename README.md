# IntentFlow

IntentFlow is a technical platform for capturing and structured processing of AI-driven search intent. It enables users to intercept conversational data from AI search providers (ChatGPT, Claude, Perplexity, Grok), transform them into deterministic campaign trees, and perform systematic SEO analysis.

The system is built as a monorepo consisting of a Chrome extension for real-time capture, a React web application for multi-dimensional analysis, and a Node.js backend for high-volume data persistence and enrichment.

## Core Features

### Multi-Surface Capture
A Chrome extension (Manifest V3) that utilizes a side-panel interface to intercept and aggregate streams from:
- ChatGPT (chatgpt.com / chat.openai.com)
- Claude (claude.ai)
- Perplexity (perplexity.ai)
- Grok (grok.com)

### Deterministic Tree Mapping
Raw conversational turns are processed into a structured hierarchical model:
1. **Prompt Root**: The user's initial or primary query.
2. **Subqueries**: Identifiable search or processing segments within the AI's response.
3. **Sites & Evidence**: Linked sources and domains cited by the AI, mapped to their respective subqueries.

### Versioned Campaign Management
Store and manage captured intent sessions as Campaigns. Each campaign can have multiple versions, allowing for:
- **Sequential Refire**: Replaying a prompt series across multiple providers to monitor result drift.
- **Lineage Preservation**: Tracking the evolution of prompts through capture and modification cycles.

### Data Enrichment & Analytics
- **Queue-Based Enrichment**: Background workers utilize BullMQ and Redis to fetch SEO data from Semrush and Ahrefs.
- **Lead Intelligence**: Extraction of lead signals and scoring based on capture turn context.
- **3-Panel Workspace**: Analysis UI designed for drilling from Prompts to Subqueries to Website Evidence.

---

## Technical Architecture

| Workspace | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express, Prisma ORM (PostgreSQL), BullMQ (Redis), Zod |
| **Web App** | React 19, Vite, Tailwind CSS, XYFlow (Tree Visualization) |
| **Extension** | React, CRXJS, Chrome scripting & sidePanel APIs |
| **Tasks** | Node.js background processors |

---

## Setup and Installation

### Prerequisites
- Node.js (18+)
- pnpm
- PostgreSQL
- Redis (for task queues)

### 1. Repository Installation
```bash
git clone https://github.com/amogharajsandur/IntentFlow.git
cd IntentFlow
pnpm install
```

### 2. Backend Configuration
Create a `.env` file in the `backend/` directory:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/intentflow"
JWT_SECRET="your-secret-key"
REDIS_URL="redis://localhost:6379"
```

### 3. Database Initialization
```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## Workspace Development

- **Backend**: `cd backend && pnpm dev` (Runs API and Workers)
- **Web App**: `cd web && pnpm dev` (Vite dev server)
- **Extension**: `cd extension && pnpm dev` (Builds to `dist/` with HMR)

---

## Key Terms
- **CaptureTurn**: A single prompt-response exchange between a user and an AI provider.
- **PromptNode**: A materialized element of the tree (Prompt, Subquery, or Site).
- **Refire**: The process of re-executing captured prompts to generate a new Campaign Version.
- **Signals**: Extracted intelligence gathered from conversation context.
