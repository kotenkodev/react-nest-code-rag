import { FileCode2, Sparkles, User } from "lucide-react";
import Markdown from "react-markdown";
import { Badge } from "./ui/badge/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "./ui/panel/panel";
import { cn } from "@/lib/utils";

interface MessageProps {
  type: "ask" | "answer";
  text: string;
  sources?: string[];
  className?: string;
}

export default function Message({ text, sources, type, className }: MessageProps) {
  const isUser = type === "ask";

  return (
    <Panel
      notch="sm"
      className={cn(
        "mb-4 transition-all duration-200",
        isUser
          ? "border-[var(--border)] bg-[var(--surface)]/70 border-l-[3px] border-l-[var(--text-muted)]"
          : "border-[var(--border)] bg-[var(--surface)] border-l-[3px] border-l-[var(--color-green)] shadow-[0_0_15px_-3px_rgba(0,237,63,0.07)]",
        className
      )}
    >
      <PanelHeader
        className={cn(
          "px-3 sm:px-4 py-2 flex items-center justify-between",
          isUser ? "bg-[var(--surface-raised)]/60" : "bg-[var(--surface-raised)]"
        )}
      >
        <div className="flex items-center gap-2">
          {isUser ? (
            <div className="flex items-center justify-center w-5 h-5 rounded-none bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
              <User size={12} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-5 h-5 rounded-none bg-[var(--color-green)]/10 border border-[var(--color-green)] text-[var(--color-green)]">
              <Sparkles size={12} />
            </div>
          )}

          <PanelTitle
            className={cn(
              "text-[0.68rem] sm:text-xs font-mono tracking-wider",
              isUser ? "text-[var(--text-secondary)]" : "text-[var(--color-green)]"
            )}
          >
            {isUser ? "USER QUERY" : "RAG RESPONSE"}
          </PanelTitle>
        </div>

        {isUser ? (
          <Badge variant="OFFLINE" className="text-[0.58rem] font-mono">
            PROMPT
          </Badge>
        ) : (
          sources && sources.length > 0 ? (
            <Badge variant="ACTIVE" className="text-[0.58rem] font-mono">
              {sources.length} {sources.length === 1 ? "SOURCE" : "SOURCES"}
            </Badge>
          ) : (
            <Badge variant="ACTIVE" className="text-[0.58rem] font-mono">
              GENERATED
            </Badge>
          )
        )}
      </PanelHeader>

      <PanelContent className="space-y-3.5 p-3 sm:p-4 text-[0.75rem] sm:text-xs leading-relaxed">
        {isUser ? (
          <p className="text-[var(--text-secondary)] whitespace-pre-wrap font-sans font-normal">
            {text}
          </p>
        ) : (
          <div className="text-[var(--text-secondary)] space-y-2 prose-sm max-w-none">
            <Markdown
              components={{
                p: ({ children }) => (
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-2 last:mb-0">
                    {children}
                  </p>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className && typeof children === "string" && !children.includes("\n");
                  return isInline ? (
                    <code
                      className="px-1.5 py-0.5 font-mono text-[0.72rem] bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border)]"
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
                  <ul className="list-disc pl-4 space-y-1 my-2 text-[var(--text-secondary)]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 space-y-1 my-2 text-[var(--text-secondary)]">
                    {children}
                  </ol>
                ),
              }}
            >
              {text}
            </Markdown>
          </div>
        )}

        {!isUser && sources && sources.length > 0 && (
          <div className="pt-2.5 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-[0.6rem] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
              <FileCode2 size={11} className="text-[var(--color-green)]" />
              <span>Referenced Sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {sources.map((source) => (
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

