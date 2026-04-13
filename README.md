# IntentFlow: AI SEO Platform

> **Capture user intent and SERP-like signals from AI chat providers to build deterministic, actionable campaign trees.**

IntentFlow is a production-ready monorepo designed to convert raw AI-search behavior (ChatGPT, Claude, Perplexity, etc.) into actionable SEO planning and lead intelligence. It captures the "hidden" search patterns within AI conversations and materializes them into a structured data layer for analysis and optimization.

---

## 🏗️ Architecture Overview

This project is a monorepo containing three core surfaces:

| Component | Path | Description | Tech Stack |
| :--- | :--- | :--- | :--- |
| **Backend** | [`/backend`](./backend) | High-performance API, data materialization & job queues. | Node.js, Express, Prisma (Postgres), Redis, BullMQ |
| **Web App** | [`/web`](./web) | Operator dashboard for campaign analysis and visualization. | React 19, Vite, Tailwind CSS, XYFlow, Radix UI |
| **Extension** | [`/extension`](./extension) | Chrome extension for live stream interception and side-panel UI. | Manifest V3, React, CRXJS, Content Scripts |

---

## ✨ Core Features

-   **Deterministic Tree Mapping**: Automatically materializes AI chat turns into prompt → subquery → site hierarchies.
-   **Multi-Provider Interception**: Seamlessly captures data from ChatGPT, Claude, Perplexity, and Grok.
-   **Campaign Versioning**: Snapshot and refire campaigns to track performance over time.
-   **Lead Intelligence**: Extracts signals and scoring from captured interactions to identify high-value opportunities.
-   **Queued Enrichment**: Integrated SEMrush and Ahrefs pipelines for deep keyword and traffic insights.
-   **Admin Workspace**: Full RBAC-protected dashboard for monitoring users, events, and lead signals.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
-   **Node.js 20+**
-   **pnpm** (preferred) or **npm**
-   **PostgreSQL** (Active instance or [Neon.tech](https://neon.tech))
-   **Redis** (Active instance or [Upstash](https://upstash.com))

### 2. Installation
Install dependencies for all workspaces from the root:
```bash
# Using pnpm
pnpm install

# Using npm
npm install
```

### 3. Environment Configuration
Each service requires its own environment setup. Copy the `.env.example` files where provided:

-   **Backend**: [`backend/.env.example`](./backend/.env.example) → `backend/.env`
-   **Web**: (Check `web/` for specific client-side requirements)

### 4. Database Setup
```bash
cd backend
pnpm prisma:generate
pnpm prisma:push
```

---

## 🛠️ Development Workflow

### Running the Backend
```bash
cd backend
npm run dev
```

### Running the Web Dashboard
```bash
cd web
npm run dev
```

### Running the Chrome Extension
```bash
cd extension
npm run dev
```
*Load the `dist` folder into Chrome via `chrome://extensions` in developer mode.*

---

## 📜 Documentation
-   **[Agent Context](./context.md)**: Deep technical dive for AI assistants and contributors.
-   **[Implementation Tasks](./tasks/README.md)**: Current roadmap and task status.
-   **[Backend README](./backend/README.md)**: Detailed API and schema documentation.

---

© 2026 IntentFlow / AI SEO Monorepo. Built for performance and precision.
