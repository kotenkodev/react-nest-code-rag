# 💻 React RAG Assistant Frontend

The web user interface for the **Code Documentation Assistant**. Built with **React 19**, **Vite**, **Tailwind CSS v4**, **TanStack Query**, and **Lucide Icons**.

---

## 🎨 UI & Design Features

- **Cyberpunk Terminal Aesthetic**: High-contrast, dark terminal theme with glowing accents, neon borders, and technical mono typography.
- **Real-Time Streaming Chat**:
  - Live Server-Sent Events (SSE) token streaming.
  - Markdown rendering with full GitHub Flavored Markdown (GFM) support via `remark-gfm`.
  - Formatted tables, inline/block code snippets, lists, and headers.
  - Interactive source file citation badges with line-number references.
- **Repository Ingestion Workflows**:
  - 🌐 **GitHub Link**: Ingest public repositories by URL.
  - 📁 **Folder Upload**: Directory picker with recursive in-browser file reading.
  - 📦 **Zip Archive**: Drag-and-drop `.zip` upload.
- **Live Status & Index Management**:
  - Live polling of repository indexing state (`PENDING`, `SUCCESS`, `FAILED`, `IDLE`) with file progress counters.
  - One-click **Reset / Clear Index** button to remove vectorized chunks and start fresh.
  - Humanized error handling and recovery alerts.

---

## 🏗️ Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable cyberpunk design system primitives
│   │   │   ├── badge/        # Status and citation badges
│   │   │   ├── button/       # Custom action buttons (EXEC, ABORT, DEFAULT)
│   │   │   ├── panel/        # Notched cyberpunk card panels
│   │   │   ├── textarea/     # Auto-resizing prompt textarea
│   │   │   └── tooltip/      # Hover tooltips
│   │   ├── ChatMessage.tsx   # Markdown message renderer with code & citations
│   │   ├── FolderUpload.tsx  # In-browser folder directory reader
│   │   ├── Sidebar.tsx       # Repository source selector & indexing status
│   │   └── Workspace.tsx     # Main chat workspace & search query input
│   ├── hooks/
│   │   ├── useApiStatus.ts   # Backend health and connectivity check
│   │   ├── useAskChat.ts     # SSE stream reader and chunk collector
│   │   ├── useConversation.ts# Chat state reducer & history management
│   │   ├── useRepository.ts  # Ingestion mutations (link, zip, folder, clear)
│   │   └── useRepositoryStatus.ts # Polling hook for repository status
│   ├── lib/
│   │   ├── error-formatter.ts# Humanized error string translator
│   │   └── utils.ts          # Classname merger (cn)
│   └── store/
│       └── store.ts          # Zustand session / user state
├── index.html
├── vite.config.ts
└── package.json
```

---

## 🔑 Environment Variables

Create `.env` in `web/`:

```env
VITE_API_URL=http://localhost:3000
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will be accessible at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Available Scripts

- `npm run dev`: Start Vite development server with HMR.
- `npm run build`: Type-check with `tsc` and build optimized production bundle.
- `npm run preview`: Locally preview the production build.
- `npm run lint`: Run Oxlint linter.
