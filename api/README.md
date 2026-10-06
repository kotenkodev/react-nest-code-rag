# ⚙️ NestJS RAG API Backend

The backend engine for the **Code Documentation Assistant**. Built on **NestJS 11**, **Prisma ORM**, **PostgreSQL with `pgvector`**, **Jina AI Embeddings**, and **Groq LLM**.

---

## 🏗️ Architecture & Modules

The application is modularly organized under `src/modules/`:

- **`AiModule`** (`src/modules/ai/`):
  - `EmbeddingService`: Integrates with Jina AI Embeddings (`jina-embeddings-v3`, 1024 dimensions). Features automatic exponential backoff retry logic on HTTP 429 rate limit triggers.
  - `LlmserviceService`: Connects to Groq (`openai/gpt-oss-120b` or Llama 3.3) for high-speed streaming completions via OpenAI SDK compatibility.
- **`IngestionModule`** (`src/modules/ingestion/`):
  - `ChunkerService`: In-memory code splitter. Filters binary files, cleans UTF-8 null bytes (`0x00`), and splits source files into semantic chunks (max 60 lines / 3500 characters) preserving line numbers.
  - `IngestionService`: Orchestrates batch vectorization with request throttling (to stay within free-tier 100k TPM limits), persists vectors into `pgvector`, and updates repository progress.
- **`RepositoriesModule`** (`src/modules/repositories/`):
  - Handles GitHub repository zip downloads, multipart file uploads, `.zip` archives, status checks, and index deletions.
- **`RagModule`** (`src/modules/rag/`):
  - `RagService`: Generates question embedding, performs top-k cosine similarity search in `pgvector`, formats code contexts, and streams the answer via Server-Sent Events (SSE).
- **`PrismaModule`** (`src/modules/prisma/`):
  - Handles database operations and raw vector queries (`<=>` cosine similarity).

---

## 🗄️ Database & pgvector Schema

The database uses PostgreSQL with the `vector` extension enabled.

### Models:
- **`User`**: Identifies the user session via email (`x-user-email` header).
- **`Repository`**: Stores repository metadata (`name`, `url`, `status`, `totalFilesCount`, `processedFilesCount`, `errorMessage`).
- **`CodeChunk`**: Stores vectorized code snippets:
  - `id`: UUID primary key.
  - `repositoryId`: Foreign key to `Repository`.
  - `filePath`: Relative file path.
  - `content`: Code snippet text.
  - `startLine`, `endLine`: Line numbers in the original file.
  - `embedding`: `vector(1024)` column indexed with `ivfflat` or `hnsw` cosine ops.

---

## 🔑 Environment Variables

Create `.env` in `api/`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/nest_db?schema=public"

# App
PORT=3000
NODE_ENV=development
CORS_ORIGINS="http://localhost:5173"

# Embeddings (Jina AI)
EMBEDDING_BASE_URL="https://api.jina.ai/v1"
EMBEDDING_API_KEY="jina_xxxxxxxxxxxxxxxxxxxxxxxx"
EMBEDDING_MODEL="jina-embeddings-v3"

# LLM (Groq)
LLM_BASE_URL="https://api.groq.com/openai/v1"
LLM_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
LLM_MODEL="openai/gpt-oss-120b"
```

---

## 🚀 Running the API

### 1. Database Setup
Make sure PostgreSQL is running with `pgvector`:
```bash
docker compose up -d
```

### 2. Apply Migrations
```bash
npx prisma migrate dev
```

### 3. Start Development Server
```bash
npm run start:dev
```

---

## 📡 API Reference

All routes are prefixed with `/api`.

### 1. Ingest GitHub Repository
- **URL**: `POST /api/repositories/link`
- **Headers**: `x-user-email: user@example.com`
- **Body**:
  ```json
  {
    "url": "https://github.com/owner/repository"
  }
  ```

### 2. Upload Zip Archive
- **URL**: `POST /api/repositories/upload-zip`
- **Headers**: `x-user-email: user@example.com`
- **Form-Data**: `file`: `repo.zip`

### 3. Upload Folder Files
- **URL**: `POST /api/repositories/upload-files`
- **Headers**: `x-user-email: user@example.com`
- **Form-Data**: `files`: `[file1, file2, ...]`, `filePaths`: `["src/index.ts", ...]`

### 4. Get Indexing Status
- **URL**: `GET /api/repositories/status`
- **Headers**: `x-user-email: user@example.com`
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "my-repo",
    "url": "https://github.com/owner/repository",
    "status": "SUCCESS",
    "totalFilesCount": 42,
    "processedFilesCount": 42,
    "errorMessage": null
  }
  ```

### 5. Clear / Delete Index
- **URL**: `DELETE /api/repositories`
- **Headers**: `x-user-email: user@example.com`
- **Response**:
  ```json
  {
    "message": "Repository and index deleted successfully"
  }
  ```

### 6. Query Assistant (Streaming SSE)
- **URL**: `POST /api/rag/query`
- **Headers**: `x-user-email: user@example.com`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "query": "Where is the authentication middleware configured?"
  }
  ```
- **Response Stream (SSE)**:
  ```
  data: {"type":"sources","sources":["src/auth/jwt.strategy.ts:1-25"]}
  data: {"type":"delta","text":"The authentication middleware..."}
  ```

---

## 🛠️ Available Scripts

- `npm run start:dev`: Run NestJS in watch mode.
- `npm run build`: Compile TypeScript production bundle.
- `npx prisma studio`: Open GUI database inspector.
- `npx prisma migrate dev`: Run schema migrations.
