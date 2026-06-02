# Wikode

A private, self-hosted AI chat tool that lets your team ask questions about one or more GitHub repositories. Admins link repos via a GitHub App, the system indexes them into a vector database, and users chat with the codebase in a multi-turn conversational interface with file + line-level citations.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js v5 (GitHub + Google OAuth) |
| Database | PostgreSQL + Prisma + pgvector |
| Embeddings | OpenAI `text-embedding-3-large` (1536 dims) |
| LLM | Anthropic Claude `claude-sonnet-4-20250514` |
| Job Queue | BullMQ + Redis |
| GitHub Integration | GitHub App |
| Styling | Tailwind CSS + shadcn/ui |

---

## Environment Setup

Copy `.env.example` to `.env` and fill in the values below.

```bash
cp .env.example .env
```

---

### 1. NEXTAUTH_SECRET

A random string used to sign session cookies.

Generate one with:

```bash
openssl rand -base64 32
```

Paste the output as `NEXTAUTH_SECRET`.

---

### 2. GitHub OAuth App (sign-in)

This is a separate OAuth App used only for user sign-in (not the GitHub App used for repo access).

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: Wikode
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID** → `GITHUB_CLIENT_ID`
6. Click **Generate a new client secret** → `GITHUB_CLIENT_SECRET`

---

### 3. Google OAuth (optional sign-in)

Skip this if you only want GitHub sign-in. Leave the Google vars empty and remove the Google provider from `lib/auth/config.ts` if desired.

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com) and create or select a project
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Choose **Web application**
5. Under **Authorized redirect URIs** add: `http://localhost:3000/api/auth/callback/google`
6. Click **Create**
7. Copy **Client ID** → `GOOGLE_CLIENT_ID`
8. Copy **Client secret** → `GOOGLE_CLIENT_SECRET`

> You may also need to configure the **OAuth consent screen** (External, Test mode is fine for personal use).

---

### 4. GitHub App (repo indexing)

The GitHub App is how Wikode gets read access to your organisation's private repositories.

#### Create the App

1. Go to [https://github.com/settings/apps/new](https://github.com/settings/apps/new)
   (or for an org: `https://github.com/organizations/YOUR_ORG/settings/apps/new`)
2. Fill in:
   - **GitHub App name**: `wikode-yourname` (must be globally unique)
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/api/github/callback`
   - **Webhook URL**: `http://localhost:3000/api/webhooks/github`
     (for local dev use a tunnel like [ngrok](https://ngrok.com): `ngrok http 3000`)
     (delta indexing only runs for pushes on each repository's configured default branch)
   - **Webhook secret**: generate one with `openssl rand -hex 20` → `GITHUB_APP_WEBHOOK_SECRET`
3. Under **Repository permissions** set:
   - **Contents**: Read-only
   - **Metadata**: Read-only
4. Under **Subscribe to events** check: **Push**
5. Set **Where can this GitHub App be installed?**: Any account (or Only on this account)
6. Click **Create GitHub App**

#### Collect the credentials

After creation you land on the app's settings page:

- **App ID** (a number near the top) → `GITHUB_APP_ID`
- **App slug** (the URL-safe name shown in the app URL, e.g. `wikode-yourname`) → `GITHUB_APP_SLUG` and `NEXT_PUBLIC_GITHUB_APP_SLUG`
- **Client ID** (under OAuth) → `GITHUB_APP_CLIENT_ID`
- Click **Generate a new client secret** → `GITHUB_APP_CLIENT_SECRET`

#### Generate the private key

Scroll to the bottom of the app settings page and click **Generate a private key**. A `.pem` file downloads. Convert it to a single-line string for the `.env` file:

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ~/Downloads/your-app.pem
```

Paste the output (starts with `-----BEGIN RSA PRIVATE KEY-----\n...`) as `GITHUB_APP_PRIVATE_KEY`.

#### Install the App

1. Go to `https://github.com/apps/YOUR_APP_SLUG` and click **Install**
2. Choose the organisation or account and select which repos to allow
3. After installation you'll be redirected to `/admin/repos?installation_id=XXXXX` — this is your installation ID (saved automatically by Wikode)

---

### 5. OpenAI API Key

Used for generating embeddings when repos are indexed.

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Copy the key → `OPENAI_API_KEY`

> Make sure your account has access to `text-embedding-3-large`. A small amount of credits is needed — indexing a typical repo costs a few cents.

---

### 6. Anthropic API Key

Used for the AI chat responses (Phase 2).

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Navigate to **API Keys** → **Create Key**
3. Copy the key → `ANTHROPIC_API_KEY`

---

## Running Locally

### Prerequisites

- Node.js 20+
- Docker (for Postgres and Redis)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres (pgvector) and Redis
docker compose up postgres redis -d

# 3. Run database migrations
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Start the Next.js dev server
npm run dev

# 6. In a separate terminal, start the ingestion worker
npm run worker
```

Open [http://localhost:3000](http://localhost:3000). The first user to sign in is automatically promoted to **Admin**.

---

## Admin Flow

1. Sign in at `/login`
2. Go to `/admin` → click **Install on org** to install the GitHub App on your organisation
3. After the GitHub redirect back to `/admin/repos`, click **Add Repos** and select the repositories to index
4. Wikode enqueues an ingestion job — the worker fetches, chunks, and embeds each file
5. Repo status changes from `PENDING` → `INDEXING` → `READY` (the page polls automatically)

---

## Project Structure

```
app/
  (auth)/login/         # Sign-in page
  (app)/
    chat/               # Chat UI (Phase 2)
    admin/              # Admin dashboard + repo management
  api/                  # All API routes
lib/
  auth/                 # NextAuth config
  github/               # GitHub App client + file walker
  embeddings/           # Chunker + OpenAI batch embeddings
  retrieval/            # pgvector similarity search
  claude/               # Streaming RAG chat (Phase 2)
  queue/                # BullMQ queue definitions
workers/
  ingestion.worker.ts   # Full repo index job
  delta.worker.ts       # Push-triggered delta re-index
prisma/
  schema.prisma         # Database schema
  migrations/           # SQL migrations (includes HNSW index)
```

---

## Docker (production)

```bash
docker compose up --build
```

Runs the Next.js app, the BullMQ worker, Postgres, and Redis as separate services.
