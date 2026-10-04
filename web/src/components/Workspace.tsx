import {
  LogOut,
  Link2,
  Folder,
  Archive,
  GitBranch,
  Search,
  ChevronRight,
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
      // data: { status: 'PROCESSING', processedFilesCount: 45, totalFilesCount: 120 }
      setProgress(data);
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        eventSource.close();
      }
    };
    return () => eventSource.close();
  }, [email]);

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="flex h-16 items-center border-b border-[var(--border)] bg-[var(--surface)] px-5">
        <Logo />
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[0.65rem] text-[var(--text-muted)] sm:block">
            {email}
          </span>
          <Button
            variant="GHOST"
            size="SM"
            onClick={onLogout}
            aria-label="Log out"
          >
            <LogOut size={14} />
          </Button>
        </div>
      </header>

      <div className="grid flex-1 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-4">
            <div className="mb-3 text-[0.6rem] tracking-[0.16em] text-[var(--text-muted)]">
              SOURCE
            </div>
            <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono truncate">
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
              <span className="truncate">{activeSource.value}</span>
            </div>

            <FolderUpload
              onSourceSelected={(source) => {
                setActiveSource(source);
              }}
              className="mt-2"
            />
          </div>
          <div className="flex h-11 items-center border-b border-[var(--border)] px-4">
            <GitBranch size={13} className="text-[var(--color-green)]" />
            <span className="ml-2 text-[0.65rem] text-[var(--text-secondary)]">
              main
            </span>
            <Badge variant="ACTIVE" className="ml-auto">
              INDEXED
            </Badge>
          </div>
          <FileTree />
        </aside>

        <section className="min-w-0 p-5 md:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <Badge
                variant={
                  progress.status === "COMPLETED"
                    ? "ACTIVE"
                    : progress.status === "PROCESSING"
                    ? "ACTIVE"
                    : "OFFLINE"
                }
              >
                {progress.status === "PROCESSING"
                  ? `PROCESSING (${progress.processedFilesCount}/${progress.totalFilesCount})`
                  : progress.status === "IDLE"
                  ? "READY"
                  : progress.status}
              </Badge>
              <h1 className="mt-4 text-2xl text-[var(--text-secondary)] md:text-3xl">
                ACME / PLATFORM
              </h1>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                TypeScript web platform · {progress.totalFilesCount || 1248} files · Ingestion active
              </p>
            </div>

            <form
              onSubmit={search}
              className="mb-8 border border-[var(--border)] bg-[var(--surface)] p-3 transition-all focus-within:border-[var(--border-active)] focus-within:shadow-[var(--glow-green)]"
            >
              <div className="mb-2 flex items-center justify-between text-[0.6rem] text-[var(--text-muted)]">
                <span>[PROMPT // QUERY ENGINE]</span>
                <span>ENTER TO SEARCH</span>
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
                className="min-h-[75px] border-none bg-transparent p-0 text-xs shadow-none focus:border-none focus:shadow-none focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-end border-t border-[var(--border)] pt-3">
                <Button type="submit" variant="EXEC" size="SM">
                  <Search size={13} /> SEARCH
                </Button>
              </div>
            </form>

            {answer ? (
              <Panel notch="sm" className="mb-6">
                <PanelHeader>
                  <PanelTitle>ANSWER</PanelTitle>
                  <Badge variant="ACTIVE" className="ml-auto">
                    3 SOURCES
                  </Badge>
                </PanelHeader>
                <PanelContent className="space-y-4 p-5 text-xs leading-6">
                  <p className="text-[var(--text-secondary)]">
                    Authentication is implemented in{" "}
                    <span className="text-[var(--color-green)]">
                      src/lib/auth.ts
                    </span>
                    . The API route creates the session, while middleware
                    validates the signed token for protected requests.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="ACTIVE">src/lib/auth.ts:12</Badge>
                    <Badge variant="OFFLINE">src/middleware.ts:8</Badge>
                    <Badge variant="OFFLINE">src/app/api/auth/route.ts:5</Badge>
                  </div>
                </PanelContent>
              </Panel>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel notch="sm">
                  <PanelHeader>
                    <PanelTitle>PROJECT OVERVIEW</PanelTitle>
                  </PanelHeader>
                  <PanelContent className="space-y-4 p-5 text-xs leading-6 text-[var(--text-muted)]">
                    <p>
                      A React and TypeScript platform with server routes,
                      token-based authentication, and a shared data layer.
                    </p>
                    <div className="border-t border-[var(--border)] pt-4">
                      <div className="mb-2 text-[0.6rem] tracking-[0.14em] text-[var(--text-secondary)]">
                        ENTRY POINTS
                      </div>
                      <div className="space-y-2 text-[var(--color-green)]">
                        <div>src/app/layout.tsx</div>
                        <div>src/middleware.ts</div>
                        <div>src/app/api/*</div>
                      </div>
                    </div>
                  </PanelContent>
                </Panel>

                <Panel notch="sm">
                  <PanelHeader>
                    <PanelTitle>KEY AREAS</PanelTitle>
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
                        className="flex w-full items-center px-5 py-3 text-left hover:bg-[var(--surface-raised)]"
                      >
                        <span className="text-xs text-[var(--text-secondary)]">
                          {label}
                        </span>
                        <span className="ml-auto text-[0.6rem] text-[var(--text-muted)]">
                          {path}
                        </span>
                        <ChevronRight
                          size={12}
                          className="ml-3 text-[var(--color-green)]"
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
