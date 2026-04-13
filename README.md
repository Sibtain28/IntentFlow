IntentFlow

IntentFlow is a full-stack platform that captures real-time AI search intent and transforms it into actionable, versioned marketing insights.

It combines a web app + Chrome extension + backend system to track, analyze, and optimize AI-driven search behavior across conversations.

✨ Key Features
🔍 Capture live AI chat intent from conversations
🌳 Map queries into campaign-version trees
🔁 Compare results using refire-based versioning
📊 Enrich data with SEO keyword intelligence (Semrush, Ahrefs)
💬 Maintain chat-thread history across providers
⚡ Execute prompts across multiple AI providers
📈 Visual dashboards for insights & performance tracking
🧠 Why IntentFlow?

AI search is changing how users discover content.

IntentFlow helps you:

Understand what users are actually asking AI
Track how intent evolves over time
Optimize campaigns based on real conversational data
🏗️ Project Structure

Based on your repo folders:

intentflow/
│
├── backend/        # Node.js backend (APIs, processing, integrations)
├── web/            # Frontend web app (dashboard, UI)
├── extension/      # Chrome extension (captures AI chat intent)
├── tasks/          # Background jobs, workflows, or processing logic
│
├── CLAUDE.md       # AI prompt/context configs
├── context.md      # Project-level context or documentation
└── .gitignore
🔄 How It Works
User interacts with AI (ChatGPT, etc.)
        ↓
Chrome Extension captures queries
        ↓
Backend processes & structures intent
        ↓
SEO enrichment (Semrush / Ahrefs)
        ↓
Stored as campaign-version tree
        ↓
Web dashboard visualizes insights
🧩 System Architecture
[ Chrome Extension ]
        ↓
[ Node.js Backend ] ───► [ SEO APIs (Semrush/Ahrefs) ]
        ↓
[ Database / Processing Layer ]
        ↓
[ Web App Dashboard ]
🛠️ Tech Stack

Frontend

React / Next.js (assumed from structure)
TailwindCSS (optional)

Backend

Node.js
Express / API Layer

Extension

Chrome Extension APIs
Content Scripts for capturing AI chats

Integrations

Semrush API
Ahrefs API
Multi-AI providers (OpenAI, etc.)
⚙️ Setup & Installation
1️⃣ Clone the Repository
git clone https://github.com/your-username/intentflow.git
cd intentflow
2️⃣ Install Dependencies
# Backend
cd backend && npm install

# Web
cd ../web && npm install

# Extension (if needed)
cd ../extension
3️⃣ Environment Variables

Create .env in backend:

OPENAI_API_KEY=your_key
SEMRUSH_API_KEY=your_key
AHREFS_API_KEY=your_key
DATABASE_URL=your_db_url
4️⃣ Run the Project
# Backend
cd backend
npm run dev

# Frontend
cd web
npm run dev
🔁 Core Concepts
🧭 Intent Capture

Tracks real user prompts from AI chats.

🌳 Campaign Trees

Groups related queries into structured marketing flows.

🔄 Refire Versioning

Re-run prompts and compare outcomes over time.

📊 Enrichment

Adds keyword data (volume, difficulty, etc.).

🔌 Extensibility
Add new AI providers
Plug in additional SEO tools
Improve intent clustering
Add analytics dashboards
Automate campaign optimization
🤝 Contributing
Fork the repo

Create a branch

git checkout -b feature/your-feature
Commit changes
Push and open a Pull Request
📌 Future Improvements
🔮 AI-based intent clustering
📊 Advanced analytics dashboards
⚡ Real-time campaign recommendations
🌐 Multi-language support
