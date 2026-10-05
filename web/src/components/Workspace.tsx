import { Search, SlidersHorizontal, XIcon } from "lucide-react";
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

export default function Workspace() {
  const [mobileTab, setMobileTab] = useState<"search" | "sources">("search");
  const [question, setQuestion] = useState("");
  const [activeSource, setActiveSource] = useState<{
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  }>({
    type: "link",
    value: "github.com/user/repo",
  });

  const { isOnline, isPending } = useApiStatus();
  const { data: status } = useRepositoryStatus();

  const progress = status || {
    status: RepositoryStatus.IDLE,
    processedFilesCount: 0,
    totalFilesCount: 0,
  };

  const {
    messages,
    addUserMessage,
    startBotMessage,
    appendBotChunk,
    setBotError,
    clearMessages,
  } = useConversation();

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
              ? "bg-(--surface-raised) text-green border border-(--border-active) font-medium"
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
              ? "bg-(--surface-raised) text-green border border-(--border-active) font-medium"
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
                <Badge
                  variant={
                    progress.status === RepositoryStatus.SUCCESS
                      ? "ACTIVE"
                      : "OFFLINE"
                  }
                  className="text-[0.6rem] sm:text-xs"
                >
                  {progress.status === RepositoryStatus.PENDING
                    ? `PENDING (${progress.processedFilesCount}/${progress.totalFilesCount})`
                    : progress.status === RepositoryStatus.IDLE
                      ? "IDLE"
                      : progress.status}
                </Badge>
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
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4">
            <div className="mx-auto max-w-4xl">
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
                className="border border-(--border) bg-(--surface-raised) p-2.5 sm:p-3 transition-all focus-within:border-(--border-active) focus-within:shadow-(--glow-green)"
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
                      status?.status === RepositoryStatus.SUCCESS
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
