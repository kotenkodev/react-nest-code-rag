# ⚡ Code Documentation Assistant (RAG)

An AI-powered Codebase Documentation and Architecture Assistant built with **React 19**, **NestJS 11**, **PostgreSQL (`pgvector`)**, **Jina AI Embeddings v3**, and **Groq LLM**.

It ingests codebases from GitHub repositories, local folders, or `.zip` archives directly into memory, splits code into semantic chunks with exact line tracking, generates 1024-dimensional vector embeddings, and provides a real-time streaming conversational interface with source citations.

---

## 📑 Table of Contents

- [Quick Setup Instructions](#-quick-setup-instructions)
- [Architecture Overview](#-architecture-overview)
- [RAG & LLM Approach & Decisions](#-rag--llm-approach--decisions)
- [Key Technical Decisions & Trade-offs](#-key-technical-decisions--trade-offs)
- [Productionization & Cloud Scalability](#-productionization--cloud-scalability-aws--gcp--azure)
- [Engineering Standards: Followed vs Skipped](#-engineering-standards-followed-vs-skipped)
- [AI-Assisted Development Approach](#-ai-assisted-development-approach)
- [What I'd Do Differently with More Time](#-what-id-do-differently-with-more-time)
- [API Reference](#-api-reference)

---

## ⚡ Quick Setup Instructions

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **Docker & Docker Compose** (for PostgreSQL + pgvector)
- **API Keys**:
  - [Jina AI API Key](https://jina.ai/) (Embeddings: 100k TPM free tier)
  - [Groq API Key](https://console.groq.com/) (LLM: ultra-low latency inference)

### 1. Start PostgreSQL with `pgvector`

```bash
docker compose up -d
```

Verify the database is running on port `5432`:

```bash
docker ps
```

### 2. Configure & Launch Backend API

```bash
cd api
cp .env.example .env
```

Fill in your API keys in `api/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/nest_db?schema=public"
PORT=3000
CORS_ORIGINS="http://localhost:5173"

EMBEDDING_API_KEY="your_jina_ai_api_key"
LLM_API_KEY="your_groq_api_key"
```

Install dependencies, run migrations, and start the development server:

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

_API will run on `http://localhost:3000`._

### 3. Configure & Launch Web Frontend

In a new terminal window:

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

_Web client will open on `http://localhost:5173`._

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph Client ["Frontend (React 19 + Vite)"]
        UI["Cyberpunk UI / Workspace"]
        Upload["Folder / Zip / GitHub Picker"]
        SSE_Client["SSE Stream Consumer"]
    end

    subgraph Backend ["Backend (NestJS 11)"]
        RepoCtrl["Repositories Controller"]
        IngestSvc["Ingestion & Chunker Service"]
        RagSvc["RAG Controller & Service"]
        EmbedSvc["Embedding Service + Backoff"]
        LlmSvc["Groq LLM Service"]
    end

    subgraph Storage ["Data Tier"]
        PG[("PostgreSQL 16 + pgvector")]
    end

    subgraph AI_Providers ["AI Cloud Services"]
        Jina["Jina AI Embeddings v3<br/>1024 dims"]
        Groq["Groq LPU Engine<br/>gpt-oss-120b / Llama-3.3"]
    end

    Upload -->|"Upload / URL"| RepoCtrl
    RepoCtrl --> IngestSvc
    IngestSvc -->|"Clean & Chunk in Memory"| IngestSvc
    IngestSvc -->|"Batched Text Chunks"| EmbedSvc
    EmbedSvc -->|"Generate Embeddings"| Jina
    EmbedSvc -->|"Embeddings"| IngestSvc
    IngestSvc -->|"Store Chunks + Vectors"| PG

    UI -->|"Ask Question"| RagSvc
    RagSvc -->|"Embed Query"| EmbedSvc
    RagSvc -->|"Cosine Similarity Search"| PG
    PG -->|"Top K Chunks"| RagSvc
    RagSvc -->|"Context + Prompt"| LlmSvc
    LlmSvc -->|"Stream Tokens"| Groq
    Groq -->|"Delta Stream"| RagSvc
    RagSvc -->|"Server-Sent Events (SSE)"| SSE_Client
```

### Ingestion Flow:

1. **Source Reception**: Supports GitHub public archive URLs, local directory picker (`webkitdirectory`), or `.zip` files.
2. **In-Memory Decompression**: Uses `adm-zip` in memory without saving raw files to server disk.
3. **Filtering & Sanitization**: Strips binary files, media, lockfiles, hidden directories, and null bytes (`0x00`).
4. **Chunking**: Splits source code into sliding windows (max 60 lines / 3500 chars) while preserving line boundaries (`startLine`-`endLine`).
5. **Throttled Vectorization**: Sends batched chunks (batch size 8 with 400ms delay and exponential backoff) to Jina AI Embeddings.
6. **Persistence**: Stores code chunks and `vector(1024)` vectors into PostgreSQL using Prisma raw vector batch inserts.

### Query Flow:

1. User submits a prompt via the UI.
2. `RagService` converts the query into a 1024-dimensional embedding.
3. PostgreSQL performs a cosine similarity search (`<=>`) over the user's active codebase index.
4. Top matching chunks are aggregated into a structured context window with file paths and line ranges.
5. Groq generates the response, streamed back to the browser token-by-token over SSE.

---

## 🧠 RAG & LLM Approach & Decisions

### 1. Model & Component Selection

| Component           | Choice                                                       | Considered Alternatives                                     | Rationale                                                                                                                                                                                        |
| :------------------ | :----------------------------------------------------------- | :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LLM Inference**   | **Groq (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`)** | OpenAI GPT-4o, Anthropic Claude 3.5, Local Ollama           | Ultra-low TTFT (time-to-first-token) and token generation speed (>250 tokens/sec) on Groq LPUs, free tier availability, and OpenAI API SDK compatibility.                                        |
| **Embedding Model** | **Jina AI (`jina-embeddings-v3` - 1024d)**                   | OpenAI `text-embedding-3-small`, HuggingFace MiniLM, Cohere | State-of-the-art code retrieval benchmark score, 8192-token context window, flexible task-specific adapter support, and generous free tier.                                                      |
| **Vector Database** | **PostgreSQL + `pgvector` (1024 dims)**                      | Pinecone, Qdrant, ChromaDB, Weaviate                        | Keeps relational metadata (users, repos, chunk line ranges) and vector embeddings strictly in one unified database with ACID transactions and zero extra infrastructure dependencies.            |
| **Orchestration**   | **Direct Typed NestJS Services**                             | LangChain.js, LlamaIndex.ts                                 | Avoids framework bloat, complex abstractions, and unpredictable streaming internals. Native NestJS dependency injection gives full control over error recovery, batch pacing, and SSE streaming. |

### 2. Prompt & Context Engineering

- **Grounding Instructions**: The system prompt strictly bounds the LLM to the provided context chunks. If an implementation is absent, the model admits it cannot find it rather than hallucinating.
- **Header Metadata Injection**: Each code chunk is formatted as:
  ```
  File: path/to/file.ts (Lines 15-45)
  ```
  This enables the model to accurately cite file paths and line ranges in its responses.

### 3. Guardrails & Quality Controls

- **Rate-Limit Resilience**: Embedding requests utilize an exponential backoff wrapper (`withRetry`) up to 5 attempts when encountering `429 RATE_TOKEN_LIMIT_EXCEEDED`.
- **Database UTF-8 Sanitization**: Filters out null bytes (`\0`) and invalid byte sequences that crash Postgres raw queries.
- **Chunk Size Clamping**: Files are clamped to 8,000 characters before embedding to guarantee zero token overflow exceptions.

### 4. Observability & Telemetry

- Structured NestJS logger across all ingestion cycles (file count, chunk count, batch timings).
- Real-time client status polling (`/api/repositories/status`) tracking indexing progress (`processedFilesCount` / `totalFilesCount`).

---

## ⚖️ Key Technical Decisions & Trade-offs

1. **In-Memory Unpacking vs Disk Caching**:
   - _Decision_: Process all repo zips and folder uploads strictly in RAM using Buffers.
   - _Trade-off_: Eliminates disk cleanup routines, orphaned temp files, and filesystem security risks; restricts maximum repository size per upload to ~50–100MB (sufficient for typical codebases).
2. **Raw SQL for Vector Search vs Prisma Native Vector Preview**:
   - _Decision_: Used raw parameterized SQL for `pgvector` similarity search (`ORDER BY embedding <=> $1::vector LIMIT $2`).
   - _Trade-off_: Requires raw SQL strings, but unlocks exact cosine distance indexing (`vector_cosine_ops`) and reliable performance without schema instability.
3. **SSE (Server-Sent Events) vs WebSockets for RAG**:
   - _Decision_: Used HTTP SSE for streaming assistant responses.
   - _Trade-off_: Unidirectional text streaming is simpler, works seamlessly through HTTP proxies, has native browser `fetch`/`EventSource` support, and requires no socket state management.
4. **Custom Cyberpunk UI Design System**:
   - _Decision_: Built customized terminal-style components (notched panels, monospace badges, glowing accents) with Tailwind CSS v4 and Lucide icons.
   - _Trade-off_: Delivers a distinctive, responsive developer-tool aesthetic rather than a generic boilerplate look.

---

## ☁️ Productionization & Cloud Scalability (AWS / GCP / Azure)

To scale this solution for enterprise production traffic across hyper-scalers:

```mermaid
graph LR
    User["Clients"] --> Cloudflare["Cloudflare CDN & WAF"]
    Cloudflare --> ALB["Application Load Balancer"]
    ALB --> ECS["NestJS API Cluster<br/>ECS Fargate / Cloud Run"]
    ECS --> SQS["Redis / BullMQ<br/>Async Ingestion Queue"]
    SQS --> Workers["Ingestion Worker Fleet<br/>Auto-scaling"]
    Workers --> RDS[("AWS Aurora PostgreSQL<br/>pgvector with HNSW Index")]
    ECS --> RDS
    Workers --> JinaCluster["Jina AI / TEI on GPU"]
    ECS --> GroqAPI["Groq / vLLM Cluster"]
```

1. **Decoupled Asynchronous Ingestion (BullMQ / AWS SQS)**:
   - Move repository parsing and embedding generation from the HTTP request thread to a dedicated background worker queue (e.g. BullMQ on Redis or AWS SQS + Lambda).
   - This prevents HTTP request timeouts on repositories with thousands of files.
2. **Database Scaling & Indexing**:
   - Migrate to **AWS Aurora PostgreSQL** or **Supabase / GCP Cloud SQL**.
   - Build **HNSW** (`hierarchical navigable small world`) vector indexes on the `embedding` column for sub-millisecond approximate nearest neighbor searches on millions of chunks.
3. **Containerized Deployment**:
   - Deploy the NestJS API on **AWS ECS Fargate**, **GCP Cloud Run**, or **Kubernetes (EKS/GKE)** with auto-scaling based on CPU/RAM and request queue depth.
   - Deploy the React frontend as static assets to **Cloudflare Pages**, **AWS S3 + CloudFront**, or **Vercel**.
4. **Security & Guardrails**:
   - Implement JWT authentication (Auth0 / AWS Cognito) with tenant-isolated database row-level security (RLS).
   - Add rate-limiting with Redis-backed Token Bucket algorithms at the API Gateway.
5. **Full Observability Suite**:
   - Integrate **OpenTelemetry (OTel)** tracing with **Datadog** or **Grafana Tempo**.
   - Instrument LLM interactions with **Langfuse** or **Arize Phoenix** to monitor prompt tokens, completion latency, hallucination rates, and semantic drift.

---

## 📐 Engineering Standards: Followed vs Skipped

### Standards Followed:

- **Strict TypeScript & Type Safety**: Shared types between DTOs, entities, and frontend hooks without loose `any` casts.
- **Modular Clean Architecture**: Separation of concerns across controllers, domain services, infrastructure adapters, and data stores.
- **Database Migrations**: Declarative schema migrations with version control via Prisma.
- **Resilient Error Recovery**: Graceful exponential backoff for third-party rate limits and friendly, humanized UI error formatting.
- **Non-Destructive UI State**: Polling status hooks with React Query caching, deduplication, and optimistic message rendering.

### Standards Skipped (Time Constraints & Prototype Scope):

- **Full OAuth2 / Multi-Tenant Auth**: Used email-header session identification (`x-user-email`) for immediate demo convenience instead of a full Cognito/Auth0 flow.
- **Distributed Worker Queue**: Ingestion runs inside NestJS async services rather than an external BullMQ/Redis worker cluster.
- **End-to-End Test Suite**: Prioritized unit-level logic and manual validation over Playwright/Cypress end-to-end test pipelines.

---

## 🤖 AI-Assisted Development Approach

### How AI Coding Tools Were Leveraged:

- **Rapid Prototyping**: Generated initial boilerplate for NestJS controllers, Prisma schemas, and Tailwind UI components.
- **Edge-Case Resolution**: Diagnosed low-level `pgvector` UTF-8 null-byte encoding failures (`0x00`) and Jina API 429 token-per-minute limits.
- **Prompt Iteration**: Refined system prompt instructions to guarantee strict code citations and eliminate hallucinations.

### My Rules & "Do's and Don'ts" for AI Coding:

- ✅ **Do's**:
  - Always verify generated raw SQL and vector index definitions against official documentation.
  - Review and understand every dependency and configuration parameter introduced.
  - Test edge cases manually (large files, invalid links, rate limit triggers) rather than assuming LLM-generated logic handles them.
- ❌ **Don'ts**:
  - Never blindly accept generated regexes for file sanitization without edge-case testing.
  - Never let an AI assistant commit undocumented architectural assumptions.
  - Never use AI to write placeholder comments instead of working implementations.

---

## 🔮 What I'd Do Differently with More Time

1. **AST-Based Semantic Chunking (Tree-sitter)**:
   - Replace line/character slicing with language-aware Abstract Syntax Tree (AST) chunking to split code cleanly along function, class, and interface boundaries.
2. **Hybrid Search (Dense + Sparse BM25) with Re-Ranking**:
   - Combine `pgvector` semantic similarity with PostgreSQL Full-Text Search (`tsvector`) and a cross-encoder re-ranker (e.g. Cohere or BGE-Reranker) for unmatched keyword accuracy (e.g., finding exact variable or method names).
3. **Interactive Code Graph Visualization**:
   - Visualize file dependency call graphs and import relationships directly within the UI.
4. **Multi-Repository Workspaces**:
   - Allow cross-repository queries across microservices and monorepos within the same user session.

---

## 📡 API Reference

| Method   | Endpoint                         | Description                                              |
| :------- | :------------------------------- | :------------------------------------------------------- |
| `POST`   | `/api/repositories/link`         | Ingest public GitHub repository from URL                 |
| `POST`   | `/api/repositories/upload-zip`   | Upload and ingest a `.zip` repository archive            |
| `POST`   | `/api/repositories/upload-files` | Upload multiple files directly from folder selection     |
| `GET`    | `/api/repositories/status`       | Get current repository indexing progress and status      |
| `DELETE` | `/api/repositories`              | Clear indexed repository and delete all vector chunks    |
| `POST`   | `/api/rag/query`                 | Query RAG assistant with Server-Sent Events (SSE) stream |
| `GET`    | `/api/health`                    | Health check endpoint                                    |
