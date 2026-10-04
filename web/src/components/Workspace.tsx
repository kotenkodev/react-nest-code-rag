import {
  LogOut,
  Link2,
  Folder,
  Archive,
  GitBranch,
  Search,
  ChevronRight,
  SlidersHorizontal,
  Code2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import Logo from "./Logo";
import { Button } from "./ui/button/button";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "./ui/panel/panel";
import { Badge } from "./ui/badge/badge";
import FileTree from "./FileTree";
import { Textarea } from "./ui/textarea/textarea";

import { FolderUpload } from "./FolderUpload";

export default function Workspace({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const [mobileTab, setMobileTab] = useState<"search" | "sources">("search");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(false);
  const [activeSource, setActiveSource] = useState<{
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  }>({
    type: "link",
    value: "github.com/acme/platform",
  });
  const [progress, setProgress] = useState({
    status: "IDLE", // 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    processedFilesCount: 0,
    totalFilesCount: 0,
  });

  function search(event: FormEvent) {
    event.preventDefault();
    if (question.trim()) setAnswer(true);
  }

  useEffect(() => {
    if (!email) return;
    const eventSource = new EventSource(
      `/api/repositories/status?email=${encodeURIComponent(email)}`
    );
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        eventSource.close();
      }
    };
    return () => eventSource.close();
  }, [email]);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Top Header */}
      <header className="flex h-14 sm:h-16 items-center border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-5">
        <Logo />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden text-[0.65rem] text-[var(--text-muted)] sm:inline-block max-w-[160px] md:max-w-[240px] truncate">
            {email}
          </span>
          <Button
            variant="GHOST"
            size="SM"
            onClick={onLogout}
            aria-label="Log out"
            className="p-1.5 sm:px-2.5"
          >
            <LogOut size={13} className="shrink-0" />
            <span className="hidden xs:inline text-[0.62rem]">LOGOUT</span>
          </Button>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible on screens < md) */}
      <div className="flex md:hidden border-b border-[var(--border)] bg-[var(--surface)] p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setMobileTab("search")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[0.65rem] font-mono transition-all ${
            mobileTab === "search"
              ? "bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border-active)] font-medium"
              : "text-[var(--text-muted)] border border-transparent"
          }`}
        >
          <Search size={12} />
          <span>QUERY & RAG</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("sources")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[0.65rem] font-mono transition-all ${
            mobileTab === "sources"
              ? "bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border-active)] font-medium"
              : "text-[var(--text-muted)] border border-transparent"
          }`}
        >
          <SlidersHorizontal size={12} />
          <span>SOURCES & FILES</span>
        </button>
      </div>

      <div className="grid flex-1 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sidebar / Ingestion Panel */}
        <aside
          className={`border-r border-[var(--border)] bg-[var(--surface)] ${
            mobileTab === "sources" ? "block" : "hidden md:block"
          }`}
        >
          <div className="border-b border-[var(--border)] p-3 sm:p-4">
            <div className="mb-2 text-[0.6rem] tracking-[0.16em] text-[var(--text-muted)] font-mono">
              ACTIVE SOURCE
            </div>
            <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono min-w-0">
              {activeSource.type === "link" ? (
                <Link2
                  size={13}
                  className="text-[var(--color-green)] shrink-0"
                />
              ) : activeSource.type === "zip" ? (
                <Archive
                  size={13}
                  className="text-[var(--color-green)] shrink-0"
                />
              ) : (
                <Folder
                  size={13}
                  className="text-[var(--color-green)] shrink-0"
                />
              )}
              <span className="truncate font-medium">{activeSource.value}</span>
            </div>

            <FolderUpload
              onSourceSelected={(source) => {
                setActiveSource(source);
              }}
              className="mt-2"
            />
          </div>

          <div className="flex h-10 sm:h-11 items-center border-b border-[var(--border)] px-3 sm:px-4">
            <GitBranch size={13} className="text-[var(--color-green)] shrink-0" />
            <span className="ml-2 text-[0.65rem] text-[var(--text-secondary)] font-mono truncate">
              main
            </span>
            <Badge variant="ACTIVE" className="ml-auto text-[0.6rem]">
              INDEXED
            </Badge>
          </div>
          <FileTree />
        </aside>

        {/* Main Workspace Section */}
        <section
          className={`min-w-0 p-3 sm:p-5 md:p-8 ${
            mobileTab === "search" ? "block" : "hidden md:block"
          }`}
        >
          <div className="mx-auto max-w-4xl">
            {/* Status & Hero Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant={
                    progress.status === "COMPLETED"
                      ? "ACTIVE"
                      : progress.status === "PROCESSING"
                      ? "ACTIVE"
                      : "OFFLINE"
                  }
                  className="text-[0.6rem] sm:text-xs"
                >
                  {progress.status === "PROCESSING"
                    ? `PROCESSING (${progress.processedFilesCount}/${progress.totalFilesCount})`
                    : progress.status === "IDLE"
                    ? "READY"
                    : progress.status}
                </Badge>
                <Badge variant="OFFLINE" className="text-[0.6rem] font-mono hidden sm:inline-flex">
                  RAG ENGINE ACTIVE
                </Badge>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-secondary)] break-words">
                ACME / PLATFORM
              </h1>
              <p className="mt-1.5 text-[0.7rem] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                TypeScript web platform · {progress.totalFilesCount || 1248} files · Ingestion active
              </p>
            </div>

            {/* Query Form */}
            <form
              onSubmit={search}
              className="mb-6 sm:mb-8 border border-[var(--border)] bg-[var(--surface)] p-2.5 sm:p-3 transition-all focus-within:border-[var(--border-active)] focus-within:shadow-[var(--glow-green)]"
            >
              <div className="mb-2 flex items-center justify-between text-[0.58rem] sm:text-[0.62rem] text-[var(--text-muted)] font-mono">
                <span>[PROMPT // QUERY ENGINE]</span>
                <span className="hidden xs:inline">ENTER TO SEARCH</span>
              </div>
              <Textarea
                value={question}
                onChange={(event) => {
                  setQuestion(event.target.value);
                  setAnswer(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (question.trim()) setAnswer(true);
                  }
                }}
                placeholder="Ask where something is implemented, trace call graphs, or search functions..."
                className="min-h-[60px] sm:min-h-[75px] border-none bg-transparent p-0 text-xs sm:text-sm shadow-none focus:border-none focus:shadow-none focus:outline-none"
              />
              <div className="mt-2.5 sm:mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 sm:pt-3">
                <span className="text-[0.6rem] font-mono text-[var(--text-muted)] hidden sm:inline">
                  Shift + Enter for new line
                </span>
                <Button
                  type="submit"
                  variant="EXEC"
                  size="SM"
                  className="ml-auto text-[0.62rem] sm:text-[0.7rem] px-3 py-1"
                >
                  <Search size={12} className="shrink-0" />
                  <span>SEARCH</span>
                </Button>
              </div>
            </form>

            {answer ? (
              <Panel notch="sm" className="mb-6">
                <PanelHeader>
                  <PanelTitle className="text-xs sm:text-sm">ANSWER</PanelTitle>
                  <Badge variant="ACTIVE" className="ml-auto text-[0.6rem]">
                    3 SOURCES
                  </Badge>
                </PanelHeader>
                <PanelContent className="space-y-4 p-3 sm:p-5 text-[0.75rem] sm:text-xs leading-relaxed">
                  <p className="text-[var(--text-secondary)]">
                    Authentication is implemented in{" "}
                    <span className="text-[var(--color-green)] font-mono">
                      src/lib/auth.ts
                    </span>
                    . The API route creates the session, while middleware
                    validates the signed token for protected requests.
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Badge variant="ACTIVE" className="text-[0.6rem] font-mono">src/lib/auth.ts:12</Badge>
                    <Badge variant="OFFLINE" className="text-[0.6rem] font-mono">src/middleware.ts:8</Badge>
                    <Badge variant="OFFLINE" className="text-[0.6rem] font-mono">src/app/api/auth/route.ts:5</Badge>
                  </div>
                </PanelContent>
              </Panel>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                <Panel notch="sm">
                  <PanelHeader>
                    <PanelTitle className="text-xs sm:text-sm flex items-center gap-1.5">
                      <Code2 size={13} className="text-[var(--color-green)]" />
                      PROJECT OVERVIEW
                    </PanelTitle>
                  </PanelHeader>
                  <PanelContent className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 text-[0.72rem] sm:text-xs leading-relaxed text-[var(--text-muted)]">
                    <p>
                      A React and TypeScript platform with server routes,
                      token-based authentication, and a shared data layer.
                    </p>
                    <div className="border-t border-[var(--border)] pt-3 sm:pt-4">
                      <div className="mb-2 text-[0.6rem] tracking-[0.14em] text-[var(--text-secondary)] font-mono">
                        ENTRY POINTS
                      </div>
                      <div className="space-y-1.5 font-mono text-[var(--color-green)] text-[0.7rem] sm:text-xs">
                        <div>src/app/layout.tsx</div>
                        <div>src/middleware.ts</div>
                        <div>src/app/api/*</div>
                      </div>
                    </div>
                  </PanelContent>
                </Panel>

                <Panel notch="sm">
                  <PanelHeader>
                    <PanelTitle className="text-xs sm:text-sm">KEY AREAS</PanelTitle>
                  </PanelHeader>
                  <PanelContent className="divide-y divide-[var(--border)] p-0">
                    {[
                      ["Authentication", "src/lib/auth.ts"],
                      ["API routes", "src/app/api"],
                      ["Database", "src/lib/db.ts"],
                      ["UI components", "src/components"],
                    ].map(([label, path]) => (
                      <button
                        key={label}
                        className="flex w-full items-center px-3.5 sm:px-5 py-2.5 sm:py-3 text-left hover:bg-[var(--surface-raised)] transition-colors min-w-0"
                      >
                        <span className="text-[0.72rem] sm:text-xs text-[var(--text-secondary)] shrink-0 font-medium">
                          {label}
                        </span>
                        <span className="ml-auto text-[0.58rem] sm:text-[0.62rem] text-[var(--text-muted)] font-mono truncate pl-2">
                          {path}
                        </span>
                        <ChevronRight
                          size={12}
                          className="ml-2 sm:ml-3 text-[var(--color-green)] shrink-0"
                        />
                      </button>
                    ))}
                  </PanelContent>
                </Panel>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
