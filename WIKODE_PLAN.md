# Wikode — Project Plan

## Overview

Wikode is a private, self-hosted AI chat tool that lets your team ask questions about one or more GitHub repositories — behaving like Claude Code or Cursor, but scoped to your own org's private codebases. Admins link repos via a GitHub App, and the system keeps the index fresh on every push to `main`. Users log in via OAuth and chat with the codebase in a multi-turn conversational interface with file + line-level citations.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | NextAuth.js v5 (GitHub OAuth + Google OAuth) |
| Database | PostgreSQL + Prisma ORM |
| Vector Store | pgvector (same Postgres instance) |
| Embeddings | OpenAI `text-embedding-3-large` |
| LLM | Anthropic Claude (`claude-sonnet-4-20250514`) |
| AI SDK | Vercel AI SDK (streaming) |
| Job Queue | BullMQ + Redis |
| GitHub Integration | GitHub App (installation-based) |
| Styling | Tailwind CSS + shadcn/ui |
| Containerization | Docker Compose |

---

## Project Structure

```
wikode/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                  # OAuth login page
│   ├── (app)/
│   │   ├── layout.tsx                    # App shell (sidebar, nav)
│   │   ├── chat/
│   │   │   ├── page.tsx                  # New chat / repo selector
│   │   │   └── [threadId]/
│   │   │       └── page.tsx              # Active chat thread
│   │   └── admin/
│   │       ├── page.tsx                  # Admin dashboard
│   │       ├── repos/
│   │       │   └── page.tsx              # Repo management
│   │       └── users/
│   │           └── page.tsx              # User management
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts              # NextAuth handler
│       ├── webhooks/
│       │   └── github/
│       │       └── route.ts              # GitHub push webhook
│       ├── github/
│       │   ├── callback/
│       │   │   └── route.ts              # GitHub App install callback
│       │   └── repos/
│       │       └── route.ts              # List available repos from installation
│       ├── repos/
│       │   ├── route.ts                  # POST: add repo to index
│       │   └── [repoId]/
│       │       ├── route.ts              # DELETE: remove repo
│       │       └── sync/
│       │           └── route.ts          # POST: manual re-sync
│       ├── chat/
│       │   └── route.ts                  # Streaming chat endpoint
│       └── threads/
│           ├── route.ts                  # GET: list threads, POST: create thread
│           └── [threadId]/
│               ├── route.ts              # GET thread, DELETE thread
│               └── messages/
│                   └── route.ts          # GET messages
├── workers/
│   ├── index.ts                          # BullMQ worker entrypoint
│   ├── ingestion.worker.ts               # Full repo ingestion job
│   └── delta.worker.ts                   # Delta re-index on push
├── lib/
│   ├── github/
│   │   ├── app.ts                        # GitHub App client (Octokit)
│   │   ├── files.ts                      # File tree walker + content fetcher
│   │   └── webhook.ts                    # Webhook signature verification
│   ├── embeddings/
│   │   ├── openai.ts                     # OpenAI embedding client
│   │   └── chunker.ts                    # File chunking logic
│   ├── retrieval/
│   │   └── search.ts                     # pgvector similarity search
│   ├── claude/
│   │   └── chat.ts                       # Anthropic streaming chat with RAG context
│   ├── queue/
│   │   └── index.ts                      # BullMQ queue definitions
│   └── auth/
│       └── config.ts                     # NextAuth config
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx                # Main chat UI
│   │   ├── MessageBubble.tsx             # Individual message with citations
│   │   ├── CitationCard.tsx              # File path + line range citation
│   │   ├── RepoSelector.tsx              # Multi-repo selector for new chats
│   │   └── ThreadSidebar.tsx             # Thread history list
│   └── admin/
│       ├── RepoCard.tsx                  # Repo status card
│       ├── AddRepoModal.tsx              # Repo selection from GitHub install
│       └── UserTable.tsx                 # User role management
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.worker
└── .env.example
```

---

## Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

enum Role {
  ADMIN
  USER
}

enum IndexStatus {
  PENDING
  INDEXING
  READY
  ERROR
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())

  accounts Account[]
  sessions Session[]
  threads  Thread[]
}

// NextAuth required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Repository {
  id               String      @id @default(cuid())
  githubRepoId     Int         @unique
  installationId   Int
  owner            String
  name             String
  fullName         String      @unique  // e.g. "org/repo"
  defaultBranch    String      @default("main")
  lastIndexedSha   String?
  status           IndexStatus @default(PENDING)
  errorMessage     String?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  files   RepoFile[]
  threads ThreadRepo[]
}

model RepoFile {
  id           String     @id @default(cuid())
  repositoryId String
  filePath     String
  language     String?
  sha          String     // git blob sha for delta detection
  updatedAt    DateTime   @updatedAt

  repository Repository @relation(fields: [repositoryId], references: [id], onDelete: Cascade)
  chunks     Chunk[]

  @@unique([repositoryId, filePath])
}

model Chunk {
  id         String                      @id @default(cuid())
  fileId     String
  content    String
  startLine  Int
  endLine    Int
  embedding  Unsupported("vector(3072)")  // text-embedding-3-large = 3072 dims
  createdAt  DateTime                    @default(now())

  file RepoFile @relation(fields: [fileId], references: [id], onDelete: Cascade)
}

model Thread {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  repos    ThreadRepo[]
  messages Message[]
}

model ThreadRepo {
  threadId     String
  repositoryId String

  thread     Thread     @relation(fields: [threadId], references: [id], onDelete: Cascade)
  repository Repository @relation(fields: [repositoryId], references: [id], onDelete: Cascade)

  @@id([threadId, repositoryId])
}

model Message {
  id        String   @id @default(cuid())
  threadId  String
  role      String   // "user" | "assistant"
  content   String
  citations Json?    // Array of { filePath, startLine, endLine, repoFullName }
  createdAt DateTime @default(now())

  thread Thread @relation(fields: [threadId], references: [id], onDelete: Cascade)
}
```

---

## Core Flows

### 1. GitHub App Setup & Repo Linking (Admin)

1. Admin clicks "Connect GitHub" in the admin panel
2. Redirected to GitHub App installation page for the org
3. GitHub redirects back to `/api/github/callback?installation_id=...`
4. Server stores `installation_id`, fetches accessible repos via GitHub App token
5. Admin sees list of repos with checkboxes → selects which to index
6. POST `/api/repos` → creates `Repository` record + enqueues `ingestion` job in BullMQ

### 2. Full Repo Ingestion (BullMQ Worker)

```
Job: { repoId, installationId, owner, name, sha }

1. Get GitHub App token for installationId
2. Fetch full file tree (git trees API, recursive)
3. Filter files:
   - Include: .ts, .tsx, .js, .jsx, .py, .go, .rs, .java, .rb, .php, .cs, .cpp, .c, .md
   - Exclude: node_modules, .git, dist, build, *.lock, *.min.js, generated files
4. For each file:
   a. Fetch content via GitHub API
   b. Chunk into ~400 token windows with 80 token overlap, tracking line numbers
   c. Batch embed chunks via OpenAI text-embedding-3-large (batch size: 100)
   d. Upsert RepoFile + Chunks in Postgres
5. Update Repository.lastIndexedSha + status = READY
```

### 3. Webhook Delta Re-indexing

```
POST /api/webhooks/github
Verify HMAC signature → parse push event

If push.ref != "refs/heads/main" → ignore

1. Find Repository by githubRepoId
2. Compare push.before → push.after (commits diff)
3. Collect added/modified/removed file paths
4. Enqueue delta job: { repoId, installationId, changedFiles, removedFiles, newSha }

Delta Worker:
- For removed files: delete RepoFile + cascade Chunks
- For added/modified files: re-fetch, re-chunk, re-embed, upsert
- Update Repository.lastIndexedSha
```

### 4. Chat with RAG

```
POST /api/chat
Body: { threadId, message, repoIds[] }

1. Embed user message via OpenAI
2. Run pgvector similarity search across selected repos:
   SELECT c.*, f.filePath, f.language, r.fullName
   FROM chunks c
   JOIN repo_files f ON c.fileId = f.id
   JOIN repositories r ON f.repositoryId = r.id
   WHERE r.id = ANY($repoIds)
   ORDER BY c.embedding <=> $queryEmbedding
   LIMIT 20

3. Re-rank chunks (deduplicate by file, prefer contiguous lines)
4. Load thread message history from DB
5. Build Claude prompt:
   - System: role + instructions to cite files
   - Context: top-K chunks with file path + line numbers
   - History: previous messages (token-capped, trim oldest first)
   - User: current message

6. Stream response via Vercel AI SDK
7. On completion: extract citations from response, save Message to DB
```

---

## Chunking Strategy

```typescript
// lib/embeddings/chunker.ts

const CHUNK_SIZE_TOKENS = 400
const CHUNK_OVERLAP_TOKENS = 80

// Each chunk includes:
{
  content: string       // raw code/text
  startLine: number
  endLine: number
  filePath: string
  language: string
}

// For code files: prefer splitting on function/class boundaries
// when possible, fall back to token-count sliding window
// For markdown: split on heading boundaries
```

---

## Claude Prompt Design

```
System:
  You are Wikode, an AI assistant that answers questions about private codebases.
  You have been given relevant code snippets retrieved from the repositories.
  Always cite your sources using the format: [filepath:startLine-endLine]
  Be specific, technical, and concise. When showing code, use the exact snippets provided.
  If the context is insufficient to answer, say so clearly.

Context (injected per request):
  === RETRIEVED CONTEXT ===
  [repo: org/repo-name | file: src/auth/middleware.ts | lines: 45-89]
  <code snippet>

  [repo: org/repo-name | file: src/auth/types.ts | lines: 12-28]
  <code snippet>
  =========================

History: (previous messages in thread, trimmed to ~8k tokens)

User: <current message>
```

---

## API Routes Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/github/repos` | Admin | List repos from GitHub App installation |
| POST | `/api/repos` | Admin | Add repo to index |
| DELETE | `/api/repos/:id` | Admin | Remove repo + delete embeddings |
| POST | `/api/repos/:id/sync` | Admin | Trigger manual re-index |
| POST | `/api/webhooks/github` | HMAC | GitHub push webhook |
| POST | `/api/chat` | User | Streaming chat endpoint |
| GET | `/api/threads` | User | List user's threads |
| POST | `/api/threads` | User | Create new thread |
| GET | `/api/threads/:id` | User | Get thread + messages |
| DELETE | `/api/threads/:id` | User | Delete thread |

---

## Environment Variables

```bash
# .env.example

# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub App
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=       # PEM key, newlines as \n
GITHUB_APP_WEBHOOK_SECRET=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/wikode

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=
```

---

## Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - postgres
      - redis

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    env_file: .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: wikode
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## Build Phases

### Phase 1 — Foundation
- [ ] Next.js 15 project setup with TypeScript, Tailwind, shadcn/ui
- [ ] Prisma schema + pgvector migration
- [ ] NextAuth with GitHub + Google OAuth
- [ ] Role-based middleware (admin vs user)
- [ ] GitHub App registration + installation OAuth flow
- [ ] Admin UI: connect GitHub org, list repos, select repos to index
- [ ] BullMQ + Redis setup
- [ ] Full ingestion worker (clone → chunk → embed → store)
- [ ] Docker Compose with postgres (pgvector image) + redis

### Phase 2 — Chat
- [ ] pgvector similarity search utility
- [ ] Streaming chat API route with RAG context injection
- [ ] Chat UI: repo selector, message thread, streaming responses
- [ ] Citation rendering (file path + line range cards)
- [ ] Thread persistence (save/load conversation history)
- [ ] Thread sidebar with history

### Phase 3 — Webhooks & Delta Indexing
- [ ] GitHub webhook endpoint with HMAC verification
- [ ] Delta ingestion worker (diff-based, only changed files)
- [ ] Repo status indicators (last indexed, indexing in progress, error)
- [ ] Manual re-sync button in admin panel

### Phase 4 — Polish
- [ ] Admin dashboard: repo list, index status, last sync time
- [ ] User management (view users, change roles)
- [ ] Token budget management for long threads (trim oldest messages)
- [ ] Error handling + retry logic in workers
- [ ] Rate limiting on chat endpoint
- [ ] Empty states, loading skeletons, error boundaries

---

## Key Implementation Notes

**pgvector index** — Create an HNSW index on the embedding column for fast ANN search at scale:
```sql
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);
```

**GitHub App token rotation** — Installation tokens expire after 1 hour. Always fetch a fresh token per job using the App's private key JWT, don't cache them.

**Embedding batching** — OpenAI embeddings API accepts up to 2048 inputs per request. Batch chunks in groups of 100 to stay safe and avoid timeouts on large repos.

**Delta detection** — Use the git blob SHA stored on `RepoFile` to detect which files actually changed content vs just metadata. Only re-embed files where `sha` differs.

**Context window budget** — Claude claude-sonnet-4-20250514 has a 200k token context. Reserve ~4k for the system prompt, ~8k for conversation history, and use the rest (~80k) for retrieved chunks. In practice, 20 chunks of ~400 tokens each = ~8k tokens of context, which is well within budget.

**Streaming** — Use Vercel AI SDK's `streamText` with the Anthropic provider. Pipe citations as a separate step after the stream completes by parsing the assistant message for `[filepath:lines]` patterns.

**Multi-repo search** — When a thread is scoped to multiple repos, run a single pgvector query with `WHERE repository_id = ANY($repoIds)` and let cosine similarity rank across all of them naturally.
```
