import {
  LogOut,
  Link2,
  Folder,
  Archive,
  GitBranch,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Logo from "./Logo";
import { Button } from "./ui/button/button";
import { Badge } from "./ui/badge/badge";
import { Textarea } from "./ui/textarea/textarea";

import { FolderUpload } from "./FolderUpload";
import Message from "./Message";
import { RepositoryStatus } from "@/types/repository-staus.types";

export default function Workspace({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const [mobileTab, setMobileTab] = useState<"search" | "sources">("search");
  const [question, setQuestion] = useState("");
  const [, setAnswer] = useState(false);
  const [activeSource, setActiveSource] = useState<{
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  }>({
    type: "link",
    value: "github.com/user/repo",
  });
  const [progress, setProgress] = useState<{
    status: RepositoryStatus;
    processedFilesCount: number;
    totalFilesCount: number;
  }>({
    status: RepositoryStatus.IDLE,
    processedFilesCount: 0,
    totalFilesCount: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  function search(event: FormEvent) {
    event.preventDefault();
    if (question.trim()) setAnswer(true);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!email) return;
    const eventSource = new EventSource(
      `/api/repositories/status?email=${encodeURIComponent(email)}`,
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
    <main className="flex h-screen max-h-screen flex-col overflow-hidden bg-[var(--background)]">
      {/* Top Header */}
      <header className="flex h-14 sm:h-16 shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-5 z-10">
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
      <div className="flex md:hidden shrink-0 border-b border-[var(--border)] bg-[var(--surface)] p-1.5 gap-1.5 z-10">
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

      <div className="grid flex-1 min-h-0 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] overflow-hidden">
        {/* Sidebar / Ingestion Panel */}
        <aside
          className={`border-r border-[var(--border)] bg-[var(--surface)] h-full overflow-y-auto ${
            mobileTab === "sources"
              ? "flex flex-col"
              : "hidden md:flex md:flex-col"
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

          <div className="flex h-10 sm:h-11 shrink-0 items-center border-b border-[var(--border)] px-3 sm:px-4">
            <GitBranch
              size={13}
              className="text-[var(--color-green)] shrink-0"
            />
            <span className="ml-2 text-[0.65rem] text-[var(--text-secondary)] font-mono truncate">
              main
            </span>
            <Badge variant="OFFLINE" className="ml-auto text-[0.6rem]">
              {RepositoryStatus.IDLE}
            </Badge>
          </div>
        </aside>

        {/* Main Workspace Section */}
        <section
          className={`min-w-0 flex flex-col h-full overflow-hidden ${
            mobileTab === "search" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Top Status & Info Bar */}
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-secondary)]">
                  Code Assistant
                </h1>
                <p className="text-[0.65rem] sm:text-xs text-[var(--text-muted)]">
                  Ask questions about the codebase, get answers from RAG system
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="SCANNING"
                  className="text-[0.6rem] font-mono hidden sm:inline-flex"
                >
                  RAG ENGINE ACTIVE
                </Badge>
                <Badge
                  variant={
                    progress.status === RepositoryStatus.COMPLETED
                      ? "ACTIVE"
                      : progress.status === RepositoryStatus.PROCESSING
                        ? "ACTIVE"
                        : "OFFLINE"
                  }
                  className="text-[0.6rem] sm:text-xs"
                >
                  {progress.status === RepositoryStatus.PROCESSING
                    ? `PROCESSING (${progress.processedFilesCount}/${progress.totalFilesCount})`
                    : progress.status === RepositoryStatus.IDLE
                      ? "IDLE"
                      : progress.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Scrollable Messages Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4">
            <div className="mx-auto max-w-4xl">
              <Message
                type="ask"
                text={
                  "Authentication is implemented The API route creates the session, while middlewar validates the signed token for protected requests."
                }
                sources={[]}
              />
              <Message
                type="answer"
                text={
                  "Authentication is implemented The API route creates the session, while middlewar validates the signed token for protected requests."
                }
                sources={[
                  "src/lib/auth.ts:12",
                  "src/middleware.ts:8",
                  "src/app/api/auth/route.ts:5",
                ]}
              />
              <Message
                type="answer"
                text={
                  "Authentication is implemented The API route creates the session, while middlewar validates the signed token for protected requests."
                }
                sources={[
                  "src/lib/auth.ts:12",
                  "src/middleware.ts:8",
                  "src/app/api/auth/route.ts:5",
                ]}
              />
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Docked Query Form at Bottom */}
          <div className="shrink-0 p-3 sm:p-4">
            <div className="mx-auto max-w-4xl">
              <form
                onSubmit={search}
                className="border border-[var(--border)] bg-[var(--surface-raised)] p-2.5 sm:p-3 transition-all focus-within:border-[var(--border-active)] focus-within:shadow-[var(--glow-green)]"
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
                  className="min-h-[50px] sm:min-h-[60px] max-h-[140px] border-none bg-transparent p-0 text-xs sm:text-sm shadow-none focus:border-none focus:shadow-none focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
