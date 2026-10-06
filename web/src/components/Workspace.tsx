import { AlertTriangle, RotateCcw, Search, SlidersHorizontal, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "./ui/button/button";
import { Badge } from "./ui/badge/badge";
import { Textarea } from "./ui/textarea/textarea";
import ChatMessage from "./ChatMessage";
import { RepositoryStatus } from "@/types/repository-status.type";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useConversation } from "@/hooks/useConversation";
import Sidebar from "./Sidebar";
import { useRepositoryStatus } from "@/hooks/useRepositoryStatus";
import { useAskChat } from "@/hooks/useAskChat";
import { useDeleteRepository } from "@/hooks/useRepository";
import { formatErrorMessage } from "@/lib/error-formatter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip/tooltip";

export default function Workspace() {
  const [mobileTab, setMobileTab] = useState<"search" | "sources">("search");
  const [question, setQuestion] = useState("");
  const [activeSource, setActiveSource] = useState<{
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  }>({
    type: "link",
    value: "No repository selected",
  });

  const { isOnline, isError } = useApiStatus();
  const { data: status } = useRepositoryStatus();

  const progress = status || {
    status: RepositoryStatus.IDLE,
    processedFilesCount: 0,
    totalFilesCount: 0,
  };

  useEffect(() => {
    if (status?.status === RepositoryStatus.IDLE || !status?.id) {
      setActiveSource({
        type: "link",
        value: "No repository selected",
        fileCount: 0,
      });
    } else if (status?.name || status?.url) {
      const isZip = status.name?.toLowerCase().includes("zip");
      setActiveSource({
        type: status.url ? "link" : isZip ? "zip" : "folder",
        value: status.url || status.name || "Local Selection",
        fileCount: status.totalFilesCount,
      });
    }
  }, [
    status?.name,
    status?.url,
    status?.totalFilesCount,
    status?.status,
    status?.id,
  ]);

  const {
    messages,
    addUserMessage,
    startBotMessage,
    appendBotChunk,
    setBotSources,
    setBotError,
    clearMessages,
  } = useConversation();

  const { mutate: deleteRepository, isPending: isDeleting } = useDeleteRepository();
  const { mutateAsync: askChat, isPending: isAskPending } = useAskChat();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function search(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAskPending) return;

    addUserMessage(trimmed);
    setQuestion("");
    const botMessageId = crypto.randomUUID();
    startBotMessage(botMessageId);

    try {
      await askChat({
        query: trimmed,
        onChunk: (chunk) => appendBotChunk(botMessageId, chunk),
        onSources: (sources) => setBotSources(botMessageId, sources),
      });
    } catch (err) {
      setBotError(
        botMessageId,
        "Failed to generate response. Please check if the API and RAG engine are online and try again.",
      );
    }
  }

  function handleClearChat() {
    clearMessages();
  }

  return (
    <main className="flex flex-1 min-h-0 flex-col overflow-hidden bg-(--background)">
      <div className="flex md:hidden shrink-0 border-b border-(--border) bg-(--surface) p-1.5 gap-1.5 z-10">
        <button
          type="button"
          onClick={() => setMobileTab("search")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[0.65rem] font-mono transition-all ${
            mobileTab === "search"
              ? "bg-(--surface-raised) text-(--text-primary) border border-(--border-active) font-medium"
              : "text-(--text-muted) border border-transparent"
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
              ? "bg-(--surface-raised) text-(--text-primary) border border-(--border-active) font-medium"
              : "text-(--text-muted) border border-transparent"
          }`}
        >
          <SlidersHorizontal size={12} />
          <span>SOURCES & FILES</span>
        </button>
      </div>

      <div className="grid flex-1 min-h-0 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] overflow-hidden">
        <Sidebar
          mobileTab={mobileTab}
          activeSource={activeSource}
          status={progress}
          onSourceSelected={setActiveSource}
        />

        <section
          className={`min-w-0 flex flex-col h-full overflow-hidden ${
            mobileTab === "search" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="shrink-0 border-b border-(--border) bg-(--surface)/60 px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-(--text-secondary)">
                  Code Assistant
                </h1>
                <p className="text-[0.65rem] sm:text-xs text-(--text-muted)">
                  Ask questions about the codebase, get answers from RAG system
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help inline-flex">
                        <Badge
                          variant={
                            progress.status === RepositoryStatus.SUCCESS
                              ? "ACTIVE"
                              : progress.status === RepositoryStatus.FAILED
                                ? "CRITICAL"
                                : progress.status === RepositoryStatus.PENDING
                                  ? "SCANNING"
                                  : "OFFLINE"
                          }
                          className="text-[0.6rem] sm:text-xs"
                        >
                          {progress.status === RepositoryStatus.PENDING
                            ? `PENDING (${progress.processedFilesCount}/${progress.totalFilesCount})`
                            : progress.status === RepositoryStatus.SUCCESS
                              ? `INDEXED (${progress.totalFilesCount} FILES)`
                              : progress.status === RepositoryStatus.IDLE
                                ? "IDLE"
                                : progress.status}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs normal-case">
                      {progress.errorMessage ? (
                        <span className="text-red-400 font-sans">
                          {formatErrorMessage(progress.errorMessage)}
                        </span>
                      ) : progress.status === RepositoryStatus.PENDING ? (
                        `Processing repository (${progress.processedFilesCount} / ${progress.totalFilesCount} files completed)`
                      ) : progress.status === RepositoryStatus.SUCCESS ? (
                        `Codebase ready (${progress.totalFilesCount} files indexed)`
                      ) : progress.status === RepositoryStatus.FAILED ? (
                        "Repository indexing failed"
                      ) : (
                        "No repository indexed"
                      )}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help inline-flex">
                        <Badge
                          variant={
                            isError ? "CRITICAL" : !isOnline ? "CRITICAL" : "SCANNING"
                          }
                          className="text-[0.6rem] font-mono hidden sm:inline-flex"
                        >
                          {!isOnline ? "RAG ENGINE INACTIVE" : "RAG ENGINE ACTIVE"}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs normal-case">
                      {!isOnline || isError
                        ? "API server is currently unreachable. Make sure backend is running on port 3000."
                        : "RAG query engine is operational with Jina AI Vector Search & Groq LLM."}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4">
            <div className="mx-auto max-w-4xl space-y-4">
              {progress.status === RepositoryStatus.FAILED && (
                <div className="border border-red-900/60 bg-red-950/20 p-3.5 sm:p-4 text-red-200 text-xs font-sans space-y-2 border-l-[3px] border-l-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-semibold">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>CODEBASE INDEXING FAILED</span>
                    </div>
                    <Button
                      variant="ABORT"
                      size="SM"
                      disabled={isDeleting}
                      onClick={() => deleteRepository()}
                      className="py-0.5 px-2 text-[0.62rem]"
                    >
                      <RotateCcw size={10} className="mr-1" />
                      <span>{isDeleting ? "RESETTING..." : "RESET & RETRY"}</span>
                    </Button>
                  </div>
                  <p className="text-red-300/90 text-xs leading-relaxed">
                    {formatErrorMessage(progress.errorMessage)}
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <ChatMessage message={message} key={message.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="shrink-0 p-3 sm:p-4">
            <div className="mx-auto max-w-4xl">
              <form
                onSubmit={search}
                className="border border-(--border) bg-(--surface-raised) p-2.5 sm:p-3 transition-all focus-within:border-(--border-active) focus-within:shadow-[var(--glow-green)]"
              >
                <div className="mb-2 flex items-center justify-between text-[0.58rem] sm:text-[0.62rem] text-(--text-muted) font-mono">
                  <p>[PROMPT // QUERY ENGINE]</p>
                  <span className="hidden xs:inline">ENTER TO SEARCH</span>
                </div>
                <Textarea
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      search(e);
                    }
                  }}
                  placeholder="Ask where something is implemented, trace call graphs, or search functions..."
                  className="min-h-12.5 sm:min-h-15 max-h-35 border-none bg-transparent p-0 text-xs sm:text-sm shadow-none focus:border-none focus:shadow-none focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between border-t border-(--border) pt-2">
                  <Button
                    variant="ABORT"
                    size="SM"
                    onClick={handleClearChat}
                    className="py-1 px-2"
                    type="button"
                  >
                    <XIcon />
                    <span>Clear</span>
                  </Button>
                  <span className="px-2 xs:text-[0.6rem] font-mono text-(--text-muted) hidden sm:inline">
                    Shift + Enter for new line
                  </span>
                  <Button
                    disabled={
                      isAskPending ||
                      status?.status !== RepositoryStatus.SUCCESS
                    }
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
