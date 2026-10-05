import { FileCode2, Sparkles, User } from "lucide-react";
import Markdown from "react-markdown";
import { Badge } from "./ui/badge/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "./ui/panel/panel";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/message.type";

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

export default function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.isUser;

  return (
    <Panel
      notch="sm"
      className={cn(
        "mb-4 transition-all duration-200",
        isUser
          ? "border-(--border) bg-(--surface)/70 border-l-[3px] border-l-(--text-muted)"
          : "border-(--border) bg-(--surface) border-l-[3px] border-l-green shadow-[0_0_15px_-3px_rgba(0,237,63,0.07)]",
        className,
      )}
    >
      <PanelHeader
        className={cn(
          "px-3 sm:px-4 py-2 flex items-center justify-between",
          isUser ? "bg-(--surface-raised)/60" : "bg-(--surface-raised)",
        )}
      >
        <div className="flex items-center gap-2">
          {isUser ? (
            <div className="flex items-center justify-center w-5 h-5 rounded-none bg-(--surface) border border-[var(--border)] text-[var(--text-muted)]">
              <User size={12} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-5 h-5 rounded-none bg-green/10 border border-[var(--color-green)] text-[var(--color-green)]">
              <Sparkles size={12} />
            </div>
          )}

          <PanelTitle
            className={cn(
              "text-[0.68rem] sm:text-xs font-mono tracking-wider",
              isUser ? "text-(--text-secondary)" : "text-green",
            )}
          >
            {isUser ? "USER QUERY" : "RAG RESPONSE"}
          </PanelTitle>
        </div>

        {isUser ? (
          <Badge variant="OFFLINE" className="text-[0.58rem] font-mono">
            PROMPT
          </Badge>
        ) : message.isError ? (
          <Badge variant="WARNING" className="text-[0.58rem] font-mono">
            ERROR
          </Badge>
        ) : (
          <Badge variant="ACTIVE" className="text-[0.58rem] font-mono">
            GENERATED
          </Badge>
        )}
      </PanelHeader>

      <PanelContent className="space-y-3.5 p-3 sm:p-4 text-[0.75rem] sm:text-xs leading-relaxed">
        {isUser ? (
          <p className="text-(--text-secondary) whitespace-pre-wrap font-sans font-normal">
            {message.text}
          </p>
        ) : (
          <div className="text-(--text-secondary) space-y-2 prose-sm max-w-none">
            <Markdown
              components={{
                p: ({ children }) => (
                  <p className="text-(--text-secondary) leading-relaxed mb-2 last:mb-0">
                    {children}
                  </p>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline =
                    !className &&
                    typeof children === "string" &&
                    !children.includes("\n");
                  return isInline ? (
                    <code
                      className="px-1.5 py-0.5 font-mono text-[0.72rem] bg-(--surface-raised) text-[var(--color-green)] border border-[var(--border)]"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="p-3 my-2 overflow-x-auto font-mono text-[0.72rem] bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border)]">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 space-y-1 my-2 text-(--text-secondary)">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 space-y-1 my-2 text-(--text-secondary)">
                    {children}
                  </ol>
                ),
              }}
            >
              {message.text}
            </Markdown>
          </div>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="pt-2.5 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-[0.6rem] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <FileCode2 size={11} className="text-[var(--color-green)]" />
              <span>Referenced Sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {message.sources?.map((source) => (
                <Badge
                  key={source}
                  variant="ACTIVE"
                  className="text-[0.6rem] font-mono hover:bg-[var(--color-green)]/10 transition-colors"
                >
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  );
}
