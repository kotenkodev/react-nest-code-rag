import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "./ui/button/button";
import { Badge } from "./ui/badge/badge";
import { Textarea } from "./ui/textarea/textarea";
import ChatMessage from "./ChatMessage";
import { RepositoryStatus } from "@/types/repository-status.type";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useConversation } from "@/hooks/useConversation";
import Sidebar from "./Sidebar";
import { useAuthStore } from "@/store/store";

export default function Workspace() {
  const { user } = useAuthStore();
  const email = user?.email;
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
  const { isOnline, isPending } = useApiStatus();

  const { messages } = useConversation();

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
    <main className="flex flex-1 min-h-0 flex-col overflow-hidden bg-[var(--background)]">
      {/* Top Header */}

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

      <div className="grid flex-1 min-h-0 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] overflow-hidden">
        {/* Sidebar / Ingestion Panel */}
        <Sidebar
          mobileTab={mobileTab}
          activeSource={activeSource}
          onSourceSelected={setActiveSource}
        />

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
                  variant={
                    isPending ? "OFFLINE" : isOnline ? "SCANNING" : "CRITICAL"
                  }
                  className="text-[0.6rem] font-mono hidden sm:inline-flex"
                >
                  {isPending
                    ? "RAG ENGINE CHECKING..."
                    : isOnline
                      ? "RAG ENGINE ACTIVE"
                      : "RAG ENGINE INACTIVE"}
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
              {messages.map((message) => (
                <ChatMessage message={message} key={message.id} />
              ))}
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
